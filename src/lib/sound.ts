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
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

const SCALE = [0, 2, 4, 5, 7, 9, 11]
const ROOT = 261.63
const PROGRESSION = [0, 5, 7]
let step = 0
let progression = 0
let lastRoot = 0

function nextRoot(): number {
  const semitones = SCALE[step % SCALE.length]
  step = (step + 1) % SCALE.length
  return ROOT * Math.pow(2, semitones / 12)
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
  const root = nextRoot()
  tone(note(root, 0), 0, 0.09, 'sine', 0.05)
  tone(note(root, 7), 0.05, 0.1, 'sine', 0.04)
}

export function chord(): void {
  const degree = PROGRESSION[progression % PROGRESSION.length]
  progression += 1
  lastRoot = degree
  const root = rootOf(degree)
  tone(note(root, 0), 0, 0.3, 'sine', 0.05)
  tone(note(root, 4), 0, 0.3, 'sine', 0.045)
  tone(note(root, 7), 0, 0.3, 'sine', 0.045)
}

export function tick(): void {
  tone(nextRoot(), 0, 0.05, 'sine', 0.03)
}

export function success(): void {
  const root = rootOf(lastRoot)
  for (const semitones of [0, 4, 7]) tone(note(root, semitones), 0, 0.2, 'sine', 0.045)

  const arp = [0, 4, 7, 12, 16, 19]
  arp.forEach((semitones, index) =>
    tone(note(root, semitones), 0.18 + index * 0.06, 0.14, 'sine', 0.045),
  )

  const end = 0.18 + arp.length * 0.06
  for (const semitones of [0, 4, 7, 12]) {
    tone(note(root, semitones), end, 0.8, 'sine', 0.04)
  }
}

export function clean(): void {
  const root = rootOf(lastRoot)
  const melody = [7, 4, 0]
  melody.forEach((semitones, index) => {
    const last = index === melody.length - 1
    tone(note(root, semitones), index * 0.18, last ? 0.5 : 0.18, 'sine', 0.045)
  })
}

export function error(): void {
  const root = nextRoot()
  tone(note(root, 7), 0, 0.16, 'triangle', 0.05)
  tone(note(root, 4), 0.09, 0.22, 'triangle', 0.045)
}
