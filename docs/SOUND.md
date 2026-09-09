# Sound Design: Agent Manual

Status: read before changing any SFX, or before lifting this into another project.

## Mental model

1. **Everything is synthesized at runtime** with the Web Audio API. No audio files,
   no network requests, no dependencies (`src/lib/sound.ts`).
2. **One global cursor ties the app together.** Every interaction advances a single
   position in the active preset's progression; the whole UI plays one continuous piece.
3. **Every voice plays the next step.** `nextChord()` hands out the current chord and
   advances, so any interaction (card, tap, checkbox, result) moves the progression
   forward and never repeats a chord until the loop wraps.
4. **Two presets.** `simple` (default) is the original I-IV-V triads + octave up with
   root+fifth single notes; `rich` is I-vi-IV-V with 7ths and a chord-tone melody.
5. **Audio is polite.** It unlocks on the first user gesture, can be muted, and the
   mute preference is persisted in `pdf-fixer:sound`.

## Pitch system (the reusable core)

- `ROOT = 261.63` (C4); `rootOf(semitones) = ROOT * 2 ** (semitones / 12)`;
  `note(root, semitones)` transposes an existing root by an interval.
- `tone(freq, at, dur, type, peak)` is the synth voice: one oscillator with a
  ~15ms attack and an exponential decay (that decay *is* the "ease out").

```ts
function tone(freq, at, dur, type = 'sine', peak = 0.05) {
  const ac = context()
  const start = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain).connect(output(ac))
  osc.start(start)
  osc.stop(start + dur + 0.05)
}
```

## The progression

Two presets live in `PRESETS` (`src/lib/sound.ts`); the default is `simple`.

**`simple`** (default, most consonant) — I-IV-V triads, then the same an octave up:

```ts
const simple = [
  { root: 0, third: 4 }, // I  C
  { root: 5, third: 4 }, // IV F
  { root: 7, third: 4 }, // V  G
  { root: 12, third: 4 }, // I'
  { root: 17, third: 4 }, // IV'
  { root: 19, third: 4 }, // V'
]
```

**`rich`** — the classic I-vi-IV-V turnaround with 7th chords, then an octave up:

```ts
const rich = [
  { root: 0, third: 4, seventh: 11 }, // Imaj7   Cmaj7
  { root: 9, third: 3, seventh: 10 }, // vi7     Am7
  { root: 5, third: 4, seventh: 11 }, // IVmaj7  Fmaj7
  { root: 7, third: 4, seventh: 10 }, // V7      G7
  { root: 12, third: 4, seventh: 11 }, // Imaj7'
  { root: 21, third: 3, seventh: 10 }, // vi7'
  { root: 17, third: 4, seventh: 11 }, // IVmaj7'
  { root: 19, third: 4, seventh: 10 }, // V7'
]
```

- `third` is 4 for major, 3 for minor; `seventh` is 11 (major 7th) or 10 (minor/dominant).
- Roots > 11 are the same chords an octave up, so the loop rises then resets.
- `nextChord()` returns the current step, records it in `lastChord`, and advances `cursor`.
- `nextTone()` rotates the chord tones; only `rich` uses it for single-note voices.
- `currentChord()` peeks without advancing (used by `lead()`).
- `strum()` staggers chord voices ~12ms apart (+ jitter) so chords roll like a
  hand-played chord instead of hitting the speaker all at once.

## Voices

| fn | shape | advances cursor |
|---|---|---|
| `chord()` | full chord (root, 3rd, 5th, +7th when the preset has one) | yes |
| `success()` | chord + rising arpeggio over its tones, held | yes |
| `clean()` | descending `[5th, third, root]` | yes |
| `error()` | descending triangle `[5th, third]` (falling = negative) | yes |
| `tap()` | simple: root+fifth; rich: two chord tones (default "anything") | yes |
| `tick()` | simple: root; rich: one chord tone, short | yes |
| `pop()` | two rising tones (played when sound is enabled) | yes |
| `flip(on)` | on: rising; off: falling (checkbox) | yes |
| `lead()` | simple: 5th; rich: 3rd of `currentChord()` (drop-zone "ask") | no |

Every voice except `lead()` calls `nextChord()`, so the chord changes on every
interaction. In `rich`, single-note voices also rotate through chord tones (`nextTone`).

Every interactable routes through this module: add-card (`result-list.ts`),
result (`result-row.ts`), download links, header info/lang, sound toggle,
auto-download checkbox (`flip`), drop zone (`lead`/`tick`), history buttons
(`press()` → `tap()`), and every dialog button/backdrop (`tick`/`tap`).

## Design principles (from UI-sound practice)

Synthesized from Material/Google sound guidance, uisfx.com and violetrecording:

- **Short and quiet.** Taps/ticks are 50–120ms; success/clean stay ~1s or less.
  Cues sit under speech and never block the next action.
- **One tonal family.** Sine voices, one key, one envelope — the app feels like one
  product (the "Super G" palette idea).
- **Rising = positive, falling = negative.** `success`/`flip(on)` rise; `error`/
  `flip(off)` fall. Contrast is by direction and timbre, not loudness.
- **Hierarchy.** Frequent cues are tiny; rare outcomes (success/error) carry shape.
- **Melody from chord tones (rich preset).** Single notes arpeggiate the chord; the
  same idea as Google's Guided Frame (IV→V→I tension and resolution).
- **Restraint & accessibility.** Sound always has a visual equivalent, is mutable,
  and the preference persists; nothing depends on audio.

## Debug & test

- `window.__pdfFixerSound` is always attached (`src/lib/sound.ts`):
  `state()` → `{ cursor, current, last, enabled, preset }`, `play(voice)`, `reset()`,
  `getPreset()` / `setPreset('simple' | 'rich')`, plus `presets` and `voices`.
  Try it in the iPad console: `__pdfFixerSound.setPreset('rich')`.
- In dev only, a floating panel (`src/components/sound-debug.ts`, mounted in
  `src/main.ts` behind `import.meta.env.DEV`) has a `simple`/`rich` switch, one
  button per voice, and a live readout. It never ships to production.
- The chosen preset persists in `pdf-fixer:sound-preset`.
- `npm run sound` (`scripts/sound-test.mjs`, Playwright against `dist/`) spies on
  `AudioContext.prototype.createOscillator` and checks both presets: simple order +
  root+fifth single notes, rich 7th-chord order + chord-tone variety, result advance,
  and cursor advance/reset.

## Verification checklist

1. `npx tsc --noEmit` and `npm run build`.
2. `npm run sound` — progression, result, and cursor checks pass.
3. `node scripts/e2e.mjs` for regressions (it toggles `#auto`, exercising `flip`).
4. To inspect pitches manually, spy on `createOscillator` and read the values
   passed to `frequency.setValueAtTime`; the lowest frequency in a chord is its root.
