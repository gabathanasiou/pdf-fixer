# Agent Context: pdf-fixer

Scope: a client-side PDF repair app. Vanilla TypeScript + Vite, one runtime dep
(`mupdf` WASM). No framework, no server. Files never leave the device. Read this
file before changing code; deeper manuals live in `docs/`.

## Commands

- `npm run dev` - Vite dev server. `npm run build` - static output in `dist/`.
  `npm run preview` - serve the build.
- **`npx tsc --noEmit`** - typecheck. There is no ESLint/Prettier; TS strict is
  the only static gate.
- `npm run smoke` - Node-level MuPDF check on `~/Downloads/Broken.pdf`
  (`scripts/smoke.mjs`); writes `/tmp/mupdf-fixed.pdf`.
- **`npm run build && node scripts/e2e.mjs`** - browser check (Playwright,
  headless Chromium) against `dist/`; serves `dist/` on `:4783` via python3,
  uploads `~/Downloads/Broken.pdf`, saves `scripts/webapp-fixed.pdf`. Requires a
  build first and the sample file to exist. Behavior/UI changes must pass it.
- `npm run og` - regenerate `public/og-image.png` + icons from
  `scripts/og-image.mjs` (Playwright render). Only needed when branding changes.

## Core Rules (read first, these override convenience)

1. **Think in components & shared modules first.** Every UI piece is a factory
   function under `src/components/`; shared logic lives in `src/lib/`. When you
   write the second copy of anything (markup, helper, string, class), extract it.
   Build DOM with `el()` (`src/lib/dom.ts:13`), never `innerHTML`.
2. **No monoliths.** `main.ts` is the composition root only (`src/main.ts:18`).
   New behavior goes into a focused module, not into `main.ts`.
3. **Narrow scope, no speculative abstractions.** Smallest change that satisfies
   the ask; every abstraction must map to a real requirement.
4. **One source of truth per concern.** Translations in `src/i18n.ts`, repair in
   `src/lib/repair.ts`, downloads in `src/lib/download.ts`, DOM building in
   `src/lib/dom.ts`, flags in `src/lib/flags.ts`, icons in `src/lib/icons.ts`.
   Do not re-derive or fork these.
5. **Component contract:** presentational components return `HTMLElement`;
   stateful ones return `{ el, ...api }` (see `ResultRow`, `AutoDownload`,
   `InfoDialog`). A component holds references to its own nodes and exposes a
   small imperative API. The parent (`main.ts`) drives it. Components MUST NOT
   query the global document or each other.
6. **All user-facing text goes through i18n.** Static text carries `data-i18n` /
   `data-i18n-aria`; dynamic text uses `t()`. Add every key to BOTH locales.
   `StringKey` is derived from the `el` catalog so a missing key fails the
   typecheck. See `docs/I18N.md`.
7. **Pure logic returns discriminated unions, not thrown UI state.**
   `repairPdf` returns `clean | fixed | error` (`src/lib/repair.ts:6`); the
   caller maps it to row setters (`src/main.ts:40`). Keep it that way.
8. **Small focused commits**, imperative mood, one revertible unit each.
9. **Verify before done.** Always `npx tsc --noEmit`. Behavior/UI changes also
   run the e2e command above. Never claim done on a failing check.

## Stack & Constraints

- Vite 6 + TypeScript strict (`target ES2022`), single runtime dep `mupdf` (WASM,
  ~10 MB, the reason the app signals readiness). `base: './'` for GitHub Pages
  (`vite.config.ts:5`); `optimizeDeps.exclude: ['mupdf']` is required for its
  top-level-await + runtime wasm fetch (`vite.config.ts:10`).
- **No UI framework.** The info modal is hand-rolled (`src/components/info-dialog.ts`);
  do not add React/Tailwind/the ui-kit for one dialog. The kit is React-only and
  would pull in Radix/TipTap/lucide plus a full rewrite.
- `window.__pdfFixerReady` is set after boot (`src/main.ts:50`, typed in
  `src/global.d.ts`) and is the e2e readiness hook. Keep it set last.
- `localStorage` holds only UI prefs: `pdf-fixer:lang` (`src/i18n.ts:3`),
  `pdf-fixer:auto-download` (`src/components/auto-download.ts:4`), and
  `pdf-fixer:sound` (`src/lib/sound.ts:1`). No app data is persisted.

## PDF Repair Model

- **Source of truth is the input bytes.** `repairPdf(file, onProgress)` opens the
  document, counts pages, computes issues, and only saves when issues > 0
  (`src/lib/repair.ts:30`).
- Issue count = `structuralIssueCount(bytes)` (duplicate `%%EOF` / `startxref`
  with trailing content, `src/lib/repair.ts:14`) + MuPDF open-log entries +
  `pdf.wasRepaired()`. Zero issues means `clean` (no output file).
- Output is `saveToBuffer('compress,garbage=4,clean')`; name via
  `outputName()` (`src/lib/download.ts:1`) as `<name>-fixed.pdf`.
- Auto-download reuses `triggerDownload()` (`src/lib/download.ts:5`).

## Header Actions (flags + info + sound)

- `Header(onInfo)` renders the info button, sound toggle and language toggle
  (`src/components/header.ts:6`). Both flags are always in the DOM; CSS shows
  the target flag via `html[lang]` (`src/style.css`), so there is NO JS
  subscription to swap flags. The label `langButton` names the language you
  switch TO (EN when in Greek, ΕΛ when in English).
- Default language is detected at boot (`detectLang`, `src/i18n.ts:119`): Greek
  when `navigator.languages` has an `el` entry or the timezone is
  `Europe/Athens`, otherwise English. An explicit toggle choice persists in
  `pdf-fixer:lang` and overrides detection.
- The info button opens `InfoDialog` (`src/components/info-dialog.ts`): vanilla
  modal with Escape + backdrop close, focus moves to the close button. Content
  is fully i18n (`info*` keys). Do not fork it into a second dialog.

## Deployment & SEO

- GitHub Pages: `.github/workflows/deploy.yml` builds `dist/`. Netlify:
  `netlify.toml` (`npm run build`, publish `dist`, security + cache headers).
- Static SEO assets live in `public/` and are copied verbatim: `robots.txt`,
  `sitemap.xml`, `site.webmanifest`, `404.html`, `favicon.svg`, `og-image.png`,
  `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
- `index.html` carries the meta description, canonical, Open Graph/Twitter tags
  and `WebApplication` JSON-LD. Runtime sets `document.title` from
  `t('docTitle')` (`src/i18n.ts:180`).
- **Placeholder domain:** `https://pdf-fixer.netlify.app/` appears in
  `index.html`, `public/robots.txt`, and `public/sitemap.xml`. Replace all three
  together when the real domain is known.

## File Layout

```
index.html                     shell: SEO head + <main id="app"> mount point
src/main.ts                    composition root + file to repair to row flow
src/components/                header, intro, drop-zone, auto-download, result-list, result-row, info-dialog
src/lib/dom.ts                 el() element factory (the only DOM builder)
src/lib/repair.ts              MuPDF repair (pure, discriminated union result)
src/lib/download.ts            outputName() / triggerDownload()
src/lib/confetti.ts            radial celebration burst on completion
src/lib/sound.ts               synthesized Web Audio SFX + mute pref
src/lib/flags.ts               inline SVG flag data URIs (el, en) + otherLang()
src/lib/icons.ts               inline SVG icons (close, document)
src/i18n.ts                    el/en catalogs, t(), setLang(), applyStatic()
src/style.css                  styles + dark mode + info modal + flag swap + two-column layout
public/                        SEO assets (robots, sitemap, manifest, 404, images)
netlify.toml                   Netlify build + headers
scripts/{smoke,e2e,og-image}.mjs  Node, Playwright e2e, asset generation
```

## Docs

- `docs/ARCHITECTURE.md` - component contract, state model, recipes. Read before
  adding/moving UI or wiring state.
- `docs/I18N.md` - locales, `t()`/`data-i18n`, adding a language. Read before
  touching any user-facing string.
- Doc budget: `AGENTS.md` stays under ~200 lines (loaded every session);
  `docs/*.md` under ~200. Prefer `file:line` pointers over prose; move detail
  out, never append.

## Verification Checklist

1. `npx tsc --noEmit` - passes.
2. `npm run build` - succeeds.
3. `node scripts/e2e.mjs` - for behavior/UI changes; result row reaches
   `.badge.ok`/`.badge.clean`, no `.badge.err`, no page errors.
4. Manual: toggle EN/ΕΛ (copy, flag, and `<html lang>` change, existing rows
   re-translate), open the info dialog and switch language inside it, process a
   PDF, confirm the download link works, reload to confirm the language persists.
