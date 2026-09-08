# Component Architecture: Agent Manual

Status: read this before adding/moving UI or wiring state.

## Mental model

1. **No framework.** Vanilla TS. Every UI piece is a factory function that builds
   and returns DOM; the parent drives it through a small imperative API.
2. **`el()` is the only DOM builder** (`src/lib/dom.ts:13`). No `innerHTML`, no
   template strings of markup, no framework runtime.
3. **`main.ts` is the composition root** (`src/main.ts:18`): it mounts components
   and runs the file to repair to row flow. It contains no markup and no repair
   logic. Pure repair lives in `src/lib/repair.ts`.

## Source of truth vs derived

- **Stored / authored:** the component's local `state` (e.g. `RowState`,
  `src/components/result-row.ts:4`) and `localStorage` UI prefs only
  (`pdf-fixer:lang`, `pdf-fixer:auto-download`). No app data is persisted.
- **Derived:** all row text, badges, notes and download links are recomputed from
  `RowState` by `render()` (`src/components/result-row.ts:37`).
- **Rule:** never read rendered text back as state, and never keep a second copy
  of a row's state outside `ResultRow`. Retranslation depends on `render()` being
  the only writer.

## Component contract

| Kind | Returns | Example |
|---|---|---|
| Presentational | `HTMLElement` | `Header(onInfo)` (`src/components/header.ts:5`), `DropZone()` (`src/components/drop-zone.ts:6`), `Intro()` (`src/components/intro.ts:4`) |
| Stateful | `{ el, ...api }` | `ResultRow()` (`src/components/result-row.ts:23`), `AutoDownload()` (`src/components/auto-download.ts:11`), `InfoDialog()` (`src/components/info-dialog.ts:22`), `ResultList()` (`src/components/result-list.ts:11`) |

- Build nodes with `el(tag, { id, class, text, attrs, on }, children)` and keep
  references to the nodes you will mutate.
- Pass behavior in as callbacks/handles (`DropZone(onFiles)`,
  `ResultList.add()`, `Header(onInfo)`); components must not reach into the
  global document or into each other.
- Text: set the initial value with `t()` AND tag it `data-i18n` /
  `data-i18n-aria` so `applyStatic()` can retranslate it. See `docs/I18N.md`.
- Stateful overlays (the info dialog) own their open/close and focus handling,
  but the trigger lives in the parent component (`Header`).

## Invariants (MUST NOT)

1. Never build markup with `innerHTML`; use `el()`. (XSS + drift.)
2. Never `document.querySelector` for a component's own nodes; hold references.
3. Never put MuPDF/repair logic in a component; it belongs in
   `src/lib/repair.ts:30`.
4. Never add a second translation source; all strings live in `src/i18n.ts:5`.
5. Never let a component call another component's internals; compose in
   `main.ts`.
6. Never mutate a row's text outside `render()`; language retranslation and
   state transitions both route through it.
7. Every `onLangChange()` subscription MUST be unsubscribed in `destroy()`
   (`src/components/result-row.ts:91`, `:111`) or it leaks across row churn.
8. Never add React/Tailwind/the ui-kit. The kit is React-only; this app is
   deliberately dependency-light. See `AGENTS.md`.

## Worked example: one file through the pipeline

| Step | Where | What happens |
|---|---|---|
| 1 | `DropZone` `change`/`drop` | calls `onFiles` (`src/components/drop-zone.ts:12`) |
| 2 | `handleFiles` | filters `.pdf`, loops sequentially (`src/main.ts:23`) |
| 3 | `fixOne` | `list.add(name)`, `row.setBusy(10)` (`src/main.ts:34`) |
| 4 | `repairPdf` | progress 10, 45, 70, returns union (`src/lib/repair.ts:30`) |
| 5 | `fixOne` | maps status to `setClean`/`setFixed`/`setError` (`src/main.ts:40`) |
| 6 | `ResultRow.render` | derives badge/meta/note/link from `RowState` (`src/components/result-row.ts:37`) |
| 7 | auto-download | `auto.isChecked()` then `triggerDownload` (`src/main.ts:44`) |

## Common tasks (recipes)

- **Add a UI element** -> new `src/components/<name>.ts` factory, then mount it in
  `main.ts:18`. Do not add markup to `index.html` (it is a shell only).
- **Add a result-row state** -> extend the `RowState` union
  (`src/components/result-row.ts:4`), handle it in `render()`, and expose a
  setter. Do not branch on state in `main.ts`.
- **Add a shared helper** -> `src/lib/`. If it builds DOM, route it through `el()`.
- **Add a persisted pref** -> mirror `AutoDownload`
  (`src/components/auto-download.ts:11`): namespaced `pdf-fixer:` key, read/write
  in `try/catch`, expose a getter.
- **Add user-facing copy** -> `src/i18n.ts` both locales; see `docs/I18N.md`.
- **Change the download name** -> `outputName()` (`src/lib/download.ts:1`), the one
  place.
- **Change a flag** -> `FLAGS` in `src/lib/flags.ts`; the `html[lang]` CSS swap
  in `src/style.css` needs no JS change.

## Verification checklist

1. `npx tsc --noEmit` passes.
2. `npm run build` succeeds.
3. `npm run build && node scripts/e2e.mjs` for any behavior/UI change: row ends
   at `.badge.ok`/`.badge.clean`, no `.badge.err`, no page errors.
4. Manual: toggle EN/ΕΛ and confirm an existing row re-translates; open the info
   dialog, close it with Escape and with a backdrop click, and switch language
   while it is open; reload to confirm the pref persisted.
