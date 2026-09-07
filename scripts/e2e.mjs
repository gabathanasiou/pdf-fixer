import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, statSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const brokenPdf = `${process.env.HOME}/Downloads/Broken.pdf`

if (!existsSync(dist)) throw new Error('dist not built — run npm run build first')
if (!existsSync(brokenPdf)) throw new Error(`missing ${brokenPdf}`)

const server = spawn('python3', ['-m', 'http.server', '4783', '--bind', '127.0.0.1'], {
  cwd: dist,
  stdio: 'ignore',
})

const browser = await chromium.launch()
const page = await browser.newPage({ acceptDownloads: true })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e}`))
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`))

try {
  await page.goto('http://127.0.0.1:4783/index.html')
  await page.waitForSelector('.drop-title', { timeout: 5000 })

  // wait until main.ts finished loading mupdf's wasm and wired its listeners
  await page.waitForFunction(() => window.__pdfFixerReady === true, null, {
    timeout: 60000,
  })
  console.log('app ready (wasm loaded, listeners attached)')

  const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null)
  await page.setInputFiles('#file', brokenPdf)
  try {
    await page.waitForSelector('.badge.ok, .badge.err', { timeout: 60000 })
  } catch {
    const state = await page.evaluate(() => ({
      rows: [...document.querySelectorAll('.row')].map((r) => ({
        name: r.querySelector('.row-name')?.textContent,
        badge: r.querySelector('.badge')?.textContent,
        meta: r.querySelector('.row-meta')?.textContent,
      })),
    }))
    console.log('ROW STATE:', JSON.stringify(state, null, 2))
    console.log('console logs:', logs.join('\n') || 'none')
    throw new Error('processing did not finish')
  }

  const badge = await page.textContent('.badge')
  if (badge?.includes('Δεν τα κατάφερε') || badge?.includes('Σφάλμα')) {
    throw new Error(`app reported failure: ${badge}`)
  }
  const download = await downloadPromise
  if (!download) throw new Error('no download triggered')
  const outPath = join(root, 'scripts', 'webapp-fixed.pdf')
  await download.saveAs(outPath)

  const docInfo = await page.evaluate(() => {
    const last = document.querySelector('.row')
    return {
      badge: last?.querySelector('.badge')?.textContent,
      meta: last?.querySelector('.row-meta')?.textContent,
    }
  })
  console.log('UI row:', JSON.stringify(docInfo))
  console.log('download name:', download.suggestedFilename())
  console.log('saved:', outPath, statSync(outPath).size, 'bytes')
  console.log('console logs:', logs.length ? logs.join('\n') : 'none')
} finally {
  await browser.close()
  server.kill()
}