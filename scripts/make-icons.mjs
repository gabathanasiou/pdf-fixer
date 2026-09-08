import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const PAGE_ART = `
  <path d="M30 25h28l12 12v40H30z" fill="#ffffff"/>
  <path d="M58 27v12h12" fill="none" stroke="#3b5bdb" stroke-width="4"/>`

const ROUNDED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#3b5bdb"/>${PAGE_ART}</svg>`

const FULL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#3b5bdb"/>
  <g transform="translate(15,15) scale(0.7)">${PAGE_ART}</g></svg>`

const jobs = [
  ['icon-180.png', 180, ROUNDED],
  ['icon-192.png', 192, ROUNDED],
  ['icon-512.png', 512, ROUNDED],
  ['icon-maskable-512.png', 512, FULL],
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size, svg] of jobs) {
  const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}</style></head>
<body style="background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</body></html>`
  await page.setContent(html)
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  })
  writeFileSync(join(outDir, name), buf)
  console.log('wrote', name, buf.length, 'bytes')
}
await browser.close()