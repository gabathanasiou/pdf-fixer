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
const EXPECTED = [0, 5, 7, 12, 17, 19]

const failures = []
function check(name, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(name)
}

const semitones = (freq) => Math.round(12 * Math.log2(freq / ROOT_FREQ))

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

  const roots = []
  for (let i = 0; i < EXPECTED.length; i++) {
    const freqs = await play('chord')
    check(`chord ${i + 1} voiced`, freqs.length >= 3, `${freqs.length} tones`)
    roots.push(semitones(Math.min(...freqs)))
  }
  check(
    'I-IV-V (then octave up) order',
    JSON.stringify(roots) === JSON.stringify(EXPECTED),
    `got [${roots}], want [${EXPECTED}]`,
  )

  await page.evaluate(() => window.__pdfFixerSound.reset())
  const cardFreqs = await play('chord')
  const cardRoot = Math.min(...cardFreqs)
  const successFreqs = await play('success')
  const successRoot = Math.min(...successFreqs)
  check(
    'result plays next chord',
    semitones(cardRoot) === EXPECTED[0] && semitones(successRoot) === EXPECTED[1],
    `card ${semitones(cardRoot)}, result ${semitones(successRoot)}`,
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
