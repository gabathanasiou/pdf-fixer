import { el } from '../lib/dom'
import { soundDebug } from '../lib/sound'

const NAMES: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' }

function chordLabel(chord: { root: number; third: number }): string {
  const name = NAMES[chord.root % 12] ?? `+${chord.root}`
  const quality = chord.third === 3 ? 'm' : ''
  const octave = Math.floor(chord.root / 12)
  return `${name}${quality}${"'".repeat(octave)}`
}

export function SoundDebug(): HTMLElement {
  const readout = el('span', { class: 'sfx-debug-readout' })

  function update(): void {
    const state = soundDebug.state()
    readout.textContent = `#${state.cursor} · now ${chordLabel(state.current)} · last ${chordLabel(
      state.last,
    )} · ${state.enabled ? 'on' : 'muted'}`
  }

  const voices = soundDebug.voices.map((voice) =>
    el('button', {
      class: 'sfx-debug-btn',
      text: voice,
      attrs: { type: 'button' },
      on: {
        click: () => {
          soundDebug.play(voice)
          update()
        },
      },
    }),
  )

  const reset = el('button', {
    class: 'sfx-debug-btn reset',
    text: 'reset',
    attrs: { type: 'button' },
    on: {
      click: () => {
        soundDebug.reset()
        update()
      },
    },
  })

  const root = el('div', { class: 'sfx-debug' }, [
    el('div', { class: 'sfx-debug-head' }, [
      el('span', { class: 'sfx-debug-title', text: 'SFX debug' }),
      readout,
    ]),
    el('div', { class: 'sfx-debug-grid' }, [...voices, reset]),
  ])

  update()
  return root
}
