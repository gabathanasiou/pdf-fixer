const STORAGE_KEY = 'pdf-fixer:sound'
const PRESET_KEY = 'pdf-fixer:sound-preset'

let ctx: AudioContext | undefined
let enabled = true

try {
  enabled = localStorage.getItem(STORAGE_KEY) !== '0'
} catch {
  /* ignore */
}

function context(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

let master: GainNode | undefined

function output(ac: AudioContext): AudioNode {
  if (!master) {
    master = ac.createGain()
    master.gain.value = 4
    master.connect(ac.destination)
  }
  return master
}

function unlock(): void {
  try {
    const ac = context()
    if (ac.state === 'suspended') void ac.resume()
  } catch {
    /* ignore */
  }
  window.removeEventListener('pointerdown', unlock)
  window.removeEventListener('keydown', unlock)
}
window.addEventListener('pointerdown', unlock)
window.addEventListener('keydown', unlock)

function tone(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType = 'sine',
  peak = 0.05,
): void {
  if (!enabled) return
  let ac: AudioContext
  try {
    ac = context()
  } catch {
    return
  }
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

const ROOT = 261.63

export interface Chord {
  root: number
  third: number
  seventh?: number
}

export type PresetName = 'simple' | 'rich'

// simple: I-IV-V triads, then an octave up (the app's original, most consonant sound)
// rich:   I-vi-IV-V with 7ths, then an octave up; single notes walk the chord tones
const PRESETS: Record<PresetName, Chord[]> = {
  simple: [
    { root: 0, third: 4 }, // I  C
    { root: 5, third: 4 }, // IV F
    { root: 7, third: 4 }, // V  G
    { root: 12, third: 4 }, // I  C'
    { root: 17, third: 4 }, // IV F'
    { root: 19, third: 4 }, // V  G'
  ],
  rich: [
    { root: 0, third: 4, seventh: 11 }, // Imaj7   Cmaj7
    { root: 9, third: 3, seventh: 10 }, // vi7     Am7
    { root: 5, third: 4, seventh: 11 }, // IVmaj7  Fmaj7
    { root: 7, third: 4, seventh: 10 }, // V7      G7
    { root: 12, third: 4, seventh: 11 }, // Imaj7'  Cmaj7
    { root: 21, third: 3, seventh: 10 }, // vi7'    Am7
    { root: 17, third: 4, seventh: 11 }, // IVmaj7' Fmaj7
    { root: 19, third: 4, seventh: 10 }, // V7'     G7
  ],
}

function loadPreset(): PresetName {
  try {
    return localStorage.getItem(PRESET_KEY) === 'rich' ? 'rich' : 'simple'
  } catch {
    return 'simple'
  }
}

let preset: PresetName = loadPreset()
let progression = PRESETS[preset]
let cursor = 0
let lastChord: Chord = progression[0]
let toneStep = 0

function advance(): void {
  cursor = (cursor + 1) % progression.length
}

function nextChord(): Chord {
  const chord = progression[cursor]
  lastChord = chord
  advance()
  return chord
}

function currentChord(): Chord {
  return progression[cursor]
}

// rich preset only: walk the chord tones so single notes form a melody
function nextTone(chord: Chord): number {
  const tones = [0, chord.third, 7, ...(chord.seventh ? [chord.seventh] : [])]
  const interval = tones[toneStep % tones.length]
  toneStep = (toneStep + 1) % tones.length
  return interval
}

function pickOne(chord: Chord): number {
  return preset === 'rich' ? nextTone(chord) : 0
}

function pickPair(chord: Chord): [number, number] {
  return preset === 'rich' ? [nextTone(chord), nextTone(chord)] : [0, 7]
}

function rootOf(semitones: number): number {
  return ROOT * Math.pow(2, semitones / 12)
}

function note(root: number, semitones: number): number {
  return root * Math.pow(2, semitones / 12)
}

// stagger chord voices by a few ms (plus a touch of jitter) so they roll
// like a hand-played chord instead of hitting the speaker at once
function strum(index: number): number {
  return index * 0.012 + Math.random() * 0.005
}

export function isSoundOn(): boolean {
  return enabled
}

export function getPreset(): PresetName {
  return preset
}

export function setPreset(name: PresetName): void {
  preset = name
  progression = PRESETS[name]
  cursor = 0
  lastChord = progression[0]
  toneStep = 0
  try {
    localStorage.setItem(PRESET_KEY, name)
  } catch {
    /* ignore */
  }
}

export function toggleSound(): boolean {
  enabled = !enabled
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (enabled) pop()
  return enabled
}

export function pop(): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  const [first, second] = pickPair(chord)
  tone(note(root, first), 0, 0.09, 'sine', 0.05)
  tone(note(root, second), 0.05, 0.1, 'sine', 0.04)
}

export function chord(): void {
  const current = nextChord()
  const root = rootOf(current.root)
  tone(note(root, 0), 0, 0.3, 'sine', 0.05)
  tone(note(root, current.third), strum(1), 0.3, 'sine', 0.045)
  tone(note(root, 7), strum(2), 0.3, 'sine', 0.045)
  if (current.seventh) tone(note(root, current.seventh), strum(3), 0.3, 'sine', 0.032)
}

export function lead(): void {
  const chord = currentChord()
  const interval = preset === 'rich' ? chord.third : 7
  tone(note(rootOf(chord.root), interval), 0, 0.28, 'sine', 0.035)
}

export function tick(): void {
  const chord = nextChord()
  tone(note(rootOf(chord.root), pickOne(chord)), 0, 0.05, 'sine', 0.03)
}

export function tap(): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  const [first, second] = pickPair(chord)
  tone(note(root, first), 0, 0.1, 'sine', 0.05)
  tone(note(root, second), strum(1), 0.1, 'sine', 0.04)
}

export function flip(on: boolean): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  const [first, second] = pickPair(chord)
  const [start, end] = on ? [first, second] : [second, first]
  tone(note(root, start), 0, 0.09, 'sine', 0.055)
  tone(note(root, end), 0.045, 0.14, 'sine', 0.05)
}

export function success(): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  const tones = chord.seventh ? [0, chord.third, 7, chord.seventh] : [0, chord.third, 7]
  tones.forEach((semitones, index) => tone(note(root, semitones), strum(index), 0.2, 'sine', 0.045))

  const arp = chord.seventh
    ? [0, chord.third, 7, chord.seventh, 12, 12 + chord.third]
    : [0, chord.third, 7, 12, 12 + chord.third, 19]
  arp.forEach((semitones, index) =>
    tone(note(root, semitones), 0.18 + index * 0.06, 0.14, 'sine', 0.045),
  )

  const end = 0.18 + arp.length * 0.06
  const held = chord.seventh ? [0, chord.third, 7, chord.seventh, 12] : [0, chord.third, 7, 12]
  held.forEach((semitones, index) =>
    tone(note(root, semitones), end + strum(index), 0.8, 'sine', 0.04),
  )
}

export function clean(): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  const melody = [7, chord.third, 0]
  melody.forEach((semitones, index) => {
    const last = index === melody.length - 1
    tone(note(root, semitones), index * 0.18, last ? 0.5 : 0.18, 'sine', 0.045)
  })
}

export function error(): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  tone(note(root, 7), 0, 0.16, 'triangle', 0.05)
  tone(note(root, chord.third), 0.09, 0.22, 'triangle', 0.045)
}

export type Voice =
  | 'tap'
  | 'tick'
  | 'pop'
  | 'flipOn'
  | 'flipOff'
  | 'lead'
  | 'chord'
  | 'success'
  | 'clean'
  | 'error'

export interface SoundState {
  cursor: number
  current: Chord
  last: Chord
  enabled: boolean
  preset: PresetName
}

export interface SoundDebugApi {
  presets: Record<PresetName, readonly Chord[]>
  progression: readonly Chord[]
  voices: readonly Voice[]
  state(): SoundState
  play(voice: Voice): void
  reset(): void
  getPreset(): PresetName
  setPreset(name: PresetName): void
}

const VOICES: Voice[] = [
  'tap',
  'tick',
  'pop',
  'flipOn',
  'flipOff',
  'lead',
  'chord',
  'success',
  'clean',
  'error',
]

function play(voice: Voice): void {
  switch (voice) {
    case 'tap':
      tap()
      return
    case 'tick':
      tick()
      return
    case 'pop':
      pop()
      return
    case 'flipOn':
      flip(true)
      return
    case 'flipOff':
      flip(false)
      return
    case 'lead':
      lead()
      return
    case 'chord':
      chord()
      return
    case 'success':
      success()
      return
    case 'clean':
      clean()
      return
    case 'error':
      error()
      return
  }
}

export const soundDebug: SoundDebugApi = {
  presets: PRESETS,
  get progression() {
    return progression
  },
  voices: VOICES,
  state: () => ({ cursor, current: currentChord(), last: lastChord, enabled, preset }),
  play,
  reset: () => {
    cursor = 0
    lastChord = progression[0]
    toneStep = 0
  },
  getPreset,
  setPreset,
}

window.__pdfFixerSound = soundDebug
