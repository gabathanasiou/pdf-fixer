# Sound Design: Agent Manual

Status: read before changing any SFX, or before lifting this into another project.

## Mental model

1. **Everything is synthesized at runtime** with the Web Audio API. No audio files,
   no network requests, no dependencies (`src/lib/sound.ts`).
2. **One global cursor ties the app together.** Every interaction advances a single
   position in one chord progression; the whole UI plays one continuous piece.
3. **Every voice plays the next step.** `nextChord()` hands out the current chord and
   advances, so any interaction (card, tap, checkbox, result) moves the progression
   forward and never repeats a pitch until the 6-step loop wraps.
4. **Audio is polite.** It unlocks on the first user gesture, can be muted, and the
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

I - IV - V in C, then the same an octave higher:

```ts
const PROGRESSION = [
  { root: 0, third: 4 },  // I  C
  { root: 5, third: 4 },  // IV F
  { root: 7, third: 4 },  // V  G
  { root: 12, third: 4 }, // I  C'
  { root: 17, third: 4 }, // IV F'
  { root: 19, third: 4 }, // V  G'
]
```

- `third` is 4 for major, 3 for minor; roots > 11 are the same chords an octave up.
- `nextChord()` returns the current step, records it in `lastChord`, and advances
  `cursor` (mod length). The 6-step loop rises an octave, then drops back to C.
- `currentChord()` peeks without advancing (used by `lead()`).
- `lastChord` is simply the most recently played chord (shown in the debug panel).

## Voices

| fn | shape | advances cursor |
|---|---|---|
| `chord()` | triad (+7th) on `nextChord()` | yes |
| `success()` | opening chord, arpeggio `[0, third, 7, 12, +third, 19]`, held chord | yes |
| `clean()` | descending `[5th, third, root]` | yes |
| `error()` | descending triangle `[5th, third]` | yes |
| `tap()` | root + fifth together, short (default "anything interactable") | yes |
| `tick()` | single root note, short | yes |
| `pop()` | two-note blip (played when sound is enabled) | yes |
| `flip(on)` | on: root→fifth; off: fifth→root (checkbox) | yes |
| `lead()` | fifth of `currentChord()`, no advance (drop-zone "ask") | no |

Every voice except `lead()` calls `nextChord()`, so the pitch changes on every
interaction. Result voices only differ in shape (arpeggio / descending / triangle).

Every interactable routes through this module: add-card (`result-list.ts`),
result (`result-row.ts`), download links, header info/lang, sound toggle,
auto-download checkbox (`flip`), drop zone (`lead`/`tick`), history buttons
(`press()` → `tap()`), and every dialog button/backdrop (`tick`/`tap`).

## Debug & test

- `window.__pdfFixerSound` is always attached (`src/lib/sound.ts`):
  `state()` → `{ cursor, current, last, enabled }`, `play(voice)`, `reset()`,
  plus `progression` and `voices`. Try it in the iPad console:
  `__pdfFixerSound.play('chord')`.
- In dev only, a floating panel (`src/components/sound-debug.ts`, mounted in
  `src/main.ts` behind `import.meta.env.DEV`) has one button per voice and a live
  readout of cursor/current/last. It never ships to production.
- `npm run sound` (`scripts/sound-test.mjs`, Playwright against `dist/`) spies on
  `AudioContext.prototype.createOscillator`, asserts the 6-step I-IV-V (octave up)
  order, that results play the next chord, and that the cursor advances/resets.

## Verification checklist

1. `npx tsc --noEmit` and `npm run build`.
2. `npm run sound` — progression, result, and cursor checks pass.
3. `node scripts/e2e.mjs` for regressions (it toggles `#auto`, exercising `flip`).
4. To inspect pitches manually, spy on `createOscillator` and read the values
   passed to `frequency.setValueAtTime`; the lowest frequency in a chord is its root.
