import { el } from '../lib/dom'
import { soundDebug, type Chord, type PresetName } from '../lib/sound'

const NAMES: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' }

function chordLabel(chord: Chord): string {
  const name = NAMES[chord.root % 12] ?? `+${chord.root}`
  const quality =
    chord.seventh === undefined
      ? chord.third === 3
        ? 'm'
        : ''
      : chord.third === 3
        ? 'm7'
        : chord.seventh === 11
          ? 'maj7'
          : '7'
  const octave = Math.floor(chord.root / 12)
  return `${name}${quality}${"'".repeat(octave)}`
}

const PRESETS: PresetName[] = ['simple', 'rich']

export function SoundDebug(): HTMLElement {
  const readout = el('span', { class: 'sfx-debug-readout' })

  const presetButtons = PRESETS.map((name) => ({
    name,
    el: el('button', {
      class: 'sfx-debug-btn preset',
      text: name,
      attrs: { type: 'button' },
      on: {
        click: () => {
          soundDebug.setPreset(name)
          update()
        },
      },
    }),
  }))

  function update(): void {
    const state = soundDebug.state()
    readout.textContent = `[${state.preset}] #${state.cursor} · now ${chordLabel(
      state.current,
    )} · last ${chordLabel(state.last)} · ${state.enabled ? 'on' : 'muted'}`
    for (const button of presetButtons) {
      button.el.classList.toggle('active', button.name === state.preset)
    }
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
    el(
      'div',
      { class: 'sfx-debug-presets' },
      presetButtons.map((button) => button.el),
    ),
    el('div', { class: 'sfx-debug-grid' }, [...voices, reset]),
  ])

  update()
  return root
}
