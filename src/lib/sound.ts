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
  tone(660, 0, 0.09, 'sine', 0.05)
  tone(990, 0.05, 0.1, 'sine', 0.04)
}

export function poof(): void {
  if (!enabled) return
  let ac: AudioContext
  try {
    ac = context()
  } catch {
    return
  }
  const start = ac.currentTime
  const duration = 0.2
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duration), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1400, start)
  filter.frequency.exponentialRampToValueAtTime(280, start + duration)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.07, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter).connect(gain).connect(ac.destination)
  source.start(start)
  source.stop(start + duration)
}

export function tick(): void {
  tone(1180, 0, 0.05, 'sine', 0.03)
}

export function success(): void {
  tone(523.25, 0, 0.16, 'sine', 0.05)
  tone(659.25, 0.07, 0.16, 'sine', 0.05)
  tone(783.99, 0.14, 0.22, 'sine', 0.05)
}

export function clean(): void {
  tone(659.25, 0, 0.14, 'sine', 0.045)
  tone(987.77, 0.08, 0.18, 'sine', 0.04)
}

export function error(): void {
  tone(392, 0, 0.16, 'triangle', 0.05)
  tone(294, 0.09, 0.22, 'triangle', 0.045)
}
