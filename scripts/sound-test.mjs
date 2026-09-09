import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const port = Number(process.env.PORT ?? 4784)

if (!existsSync(dist)) throw new Error('dist not built, run npm run build first')

const ROOT_FREQ = 261.63
const SIMPLE = [0, 5, 7, 12, 17, 19]
const RICH = [0, 9, 5, 7, 12, 21, 17, 19]

const failures = []
function check(name, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(name)
}

const semitones = (freq) => Math.round(12 * Math.log2(freq / ROOT_FREQ))
const pitchClass = (freq) => ((semitones(freq) % 12) + 12) % 12

const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: dist,
  stdio: 'ignore',
})

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('pageerror', (e) => failures.push(`pageerror: ${e}`))

try {
  await page.addInitScript(() => {
    window.__sfxFreqs = []
    const proto = AudioContext.prototype
    const createOscillator = proto.createOscillator
    proto.createOscillator = function () {
      const osc = createOscillator.call(this)
      const setValueAtTime = osc.frequency.setValueAtTime.bind(osc.frequency)
      osc.frequency.setValueAtTime = (value, time) => {
        window.__sfxFreqs.push(value)
        return setValueAtTime(value, time)
      }
      return osc
    }
  })

  await page.goto(`http://127.0.0.1:${port}/index.html`)
  await page.waitForFunction(() => window.__pdfFixerSound, null, { timeout: 30000 })

  async function play(voice) {
    await page.evaluate(() => {
      window.__sfxFreqs.length = 0
    })
    await page.evaluate((v) => window.__pdfFixerSound.play(v), voice)
    return page.evaluate(() => [...window.__sfxFreqs])
  }

  async function rootsFor(expected) {
    const roots = []
    for (let i = 0; i < expected.length; i++) {
      const freqs = await play('chord')
      check(`chord ${i + 1} voiced`, freqs.length >= 3, `${freqs.length} tones`)
      roots.push(semitones(Math.min(...freqs)))
    }
    return roots
  }

  const initial = await page.evaluate(() => window.__pdfFixerSound.getPreset())
  check('default preset is simple', initial === 'simple', initial)

  const simpleRoots = await rootsFor(SIMPLE)
  check(
    'simple I-IV-V (octave up) order',
    JSON.stringify(simpleRoots) === JSON.stringify(SIMPLE),
    `got [${simpleRoots}], want [${SIMPLE}]`,
  )

  await page.evaluate(() => window.__pdfFixerSound.setPreset('rich'))
  const richRoots = await rootsFor(RICH)
  check(
    'rich I-vi-IV-V 7ths (octave up) order',
    JSON.stringify(richRoots) === JSON.stringify(RICH),
    `got [${richRoots}], want [${RICH}]`,
  )

  await page.evaluate(() => window.__pdfFixerSound.reset())
  const cardFreqs = await play('chord')
  const successFreqs = await play('success')
  check(
    'result plays next chord',
    semitones(Math.min(...cardFreqs)) === RICH[0] &&
      semitones(Math.min(...successFreqs)) === RICH[1],
    `card ${semitones(Math.min(...cardFreqs))}, result ${semitones(Math.min(...successFreqs))}`,
  )

  const variety = new Set()
  for (let i = 0; i < 8; i++) {
    const freqs = await play('tap')
    for (const freq of freqs) variety.add(semitones(freq))
  }
  check('rich single notes vary (chord tones)', variety.size >= 5, `${variety.size} distinct pitches`)

  await page.evaluate(() => window.__pdfFixerSound.setPreset('simple'))
  await page.evaluate(() => window.__pdfFixerSound.reset())
  const tapFreqs = await play('tap')
  const classes = [...new Set(tapFreqs.map(pitchClass))].sort((a, b) => a - b)
  check(
    'simple single note is root+fifth',
    JSON.stringify(classes) === JSON.stringify([0, 7]),
    `got [${classes}]`,
  )

  await page.evaluate(() => window.__pdfFixerSound.reset())
  const before = await page.evaluate(() => window.__pdfFixerSound.state().cursor)
  await play('tap')
  const after = await page.evaluate(() => window.__pdfFixerSound.state().cursor)
  check('cursor advances', before === 0 && after === 1, `${before} -> ${after}`)

  for (const voice of ['success', 'clean', 'error']) {
    await page.evaluate(() => window.__pdfFixerSound.reset())
    const from = await page.evaluate(() => window.__pdfFixerSound.state().cursor)
    await play(voice)
    const to = await page.evaluate(() => window.__pdfFixerSound.state().cursor)
    check(`${voice} advances cursor`, from === 0 && to === 1, `${from} -> ${to}`)
  }

  if (failures.length) {
    console.log(`\n${failures.length} failure(s)`)
    process.exitCode = 1
  } else {
    console.log('\nall sound checks passed')
  }
} finally {
  await browser.close()
  server.kill()
}
