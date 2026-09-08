const STORAGE_KEY = 'pdf-fixer:sound'

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

interface Chord {
  root: number
  third: number
}

// I - IV - V in C, then the same an octave up (6-step loop)
const PROGRESSION: Chord[] = [
  { root: 0, third: 4 }, // I  C
  { root: 5, third: 4 }, // IV F
  { root: 7, third: 4 }, // V  G
  { root: 12, third: 4 }, // I  C'
  { root: 17, third: 4 }, // IV F'
  { root: 19, third: 4 }, // V  G'
]

let cursor = 0
let lastChord: Chord = PROGRESSION[0]

function advance(): void {
  cursor = (cursor + 1) % PROGRESSION.length
}

function nextChord(): Chord {
  const chord = PROGRESSION[cursor]
  lastChord = chord
  advance()
  return chord
}

function currentChord(): Chord {
  return PROGRESSION[cursor]
}

function rootOf(semitones: number): number {
  return ROOT * Math.pow(2, semitones / 12)
}

function note(root: number, semitones: number): number {
  return root * Math.pow(2, semitones / 12)
}

export function isSoundOn(): boolean {
  return enabled
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
  tone(note(root, 0), 0, 0.09, 'sine', 0.05)
  tone(note(root, 7), 0.05, 0.1, 'sine', 0.04)
}

export function chord(): void {
  const current = nextChord()
  const root = rootOf(current.root)
  tone(note(root, 0), 0, 0.3, 'sine', 0.05)
  tone(note(root, current.third), 0, 0.3, 'sine', 0.045)
  tone(note(root, 7), 0, 0.3, 'sine', 0.045)
}

export function lead(): void {
  const chord = currentChord()
  tone(note(rootOf(chord.root), 7), 0, 0.28, 'sine', 0.035)
}

export function tick(): void {
  const chord = nextChord()
  tone(rootOf(chord.root), 0, 0.05, 'sine', 0.03)
}

export function tap(): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  tone(note(root, 0), 0, 0.1, 'sine', 0.05)
  tone(note(root, 7), 0, 0.1, 'sine', 0.04)
}

export function flip(on: boolean): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  const [first, second] = on ? [0, 7] : [7, 0]
  tone(note(root, first), 0, 0.09, 'sine', 0.055)
  tone(note(root, second), 0.045, 0.14, 'sine', 0.05)
}

export function success(): void {
  const chord = nextChord()
  const root = rootOf(chord.root)
  for (const semitones of [0, chord.third, 7])
    tone(note(root, semitones), 0, 0.2, 'sine', 0.045)

  const arp = [0, chord.third, 7, 12, 12 + chord.third, 19]
  arp.forEach((semitones, index) =>
    tone(note(root, semitones), 0.18 + index * 0.06, 0.14, 'sine', 0.045),
  )

  const end = 0.18 + arp.length * 0.06
  for (const semitones of [0, chord.third, 7, 12]) {
    tone(note(root, semitones), end, 0.8, 'sine', 0.04)
  }
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
}

export interface SoundDebugApi {
  progression: readonly Chord[]
  voices: readonly Voice[]
  state(): SoundState
  play(voice: Voice): void
  reset(): void
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
  progression: PROGRESSION,
  voices: VOICES,
  state: () => ({ cursor, current: currentChord(), last: lastChord, enabled }),
  play,
  reset: () => {
    cursor = 0
    lastChord = PROGRESSION[0]
  },
}

window.__pdfFixerSound = soundDebug
