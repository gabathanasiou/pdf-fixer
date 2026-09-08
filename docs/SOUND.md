# Sound Design: Agent Manual

Status: read before changing any SFX, or before lifting this into another project.

## Mental model

1. **Everything is synthesized at runtime** with the Web Audio API. No audio files,
   no network requests, no dependencies (`src/lib/sound.ts`).
2. **One key ties the app together.** Add-card chords walk a `I -> IV -> V`
   progression in C major; every result jingle replays the *same chord* as the
   card that spawned it, so the UI sounds like a single song rather than random
   beeps.
3. **Audio is polite.** It unlocks on the first user gesture, can be muted, and
   the mute preference is persisted in `pdf-fixer:sound`.

## Pitch system (the reusable core)

- `ROOT = 261.63` (C4) and `SCALE = [0, 2, 4, 5, 7, 9, 11]` (major scale
  semitones).
- `rootOf(semitones)` returns a frequency by equal temperament:
  `ROOT * 2 ** (semitones / 12)`.
- `note(root, semitones)` transposes an existing root by an interval.
- `nextRoot()` cycles the scale for incidental sounds.
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
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}
```

## The musical relationships

- **Add-card chord**: `PROGRESSION = [0, 5, 7]` (I, IV, V in C major). Each
  `chord()` takes the next degree, stores it in `lastRoot`, and plays a major
  triad (root, +4, +7). Consecutive cards are therefore *different but consonant*
  (a real I-IV-V progression).
- **Result jingle**: `success()` and `clean()` read `lastRoot`, so they play the
  exact chord of the card that just finished. This is the trick that makes the
  result "harmonize" with the add-card instead of clashing.
- **Success shape**: opening chord, then a 6-note arpeggio `[0, 4, 7, 12, 16,
  19]`, then a closing chord held with the exponential ease-out.
- **Clean shape**: a softer sibling of success, just three descending triad tones
  (5th, 3rd, root) with the last held.
- **Incidental sounds** (`pop`, `tick`, `error`) cycle the scale via `nextRoot()`
  so they are musical but independent of the card key.

## Worked example

| Card | Add-card chord | Result jingle (same root) |
|---|---|---|
| 1 | I: C-E-G | C-E-G (success), G-E-C (clean) |
| 2 | IV: F-A-C | F-A-C |
| 3 | V: G-B-D | G-B-D |

Each add-card is consonant with the previous one, and each result is consonant
with its own add-card.

## Reuse recipe (other projects)

1. Copy `src/lib/sound.ts`; it has zero imports and only touches the Web Audio API.
2. Keep `ROOT`, `SCALE`, `rootOf`, `note`, `tone` as the synth core.
3. Define your own `PROGRESSION` (any semitone sequence) for the "entry" sound
   and store the chosen degree. Have the "result" sound read that stored degree
   so the two always match.
4. Unlock the `AudioContext` on the first `pointerdown`/`keydown` (browsers block
   autoplay otherwise) and gate every play on a persisted mute flag.
5. Keep the visual counterpart (confetti, pop) separate and respect
   `prefers-reduced-motion` for it; the audio is unaffected.

## Verification checklist

1. `npx tsc --noEmit` and `npm run build`.
2. `node scripts/e2e.mjs` for regressions.
3. To inspect pitches, spy on `AudioContext.prototype.createOscillator` and read
   the values passed to `frequency.setValueAtTime`; assert the entry chord and the
   result chord share a root and that consecutive entries differ.
