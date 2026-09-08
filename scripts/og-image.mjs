import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public')
mkdirSync(out, { recursive: true })

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="20" fill="#b18fd6"/>
<path d="M30 25h28l12 12v40H30z" fill="#fff"/>
<path d="M58 27v12h12" fill="none" stroke="#b18fd6" stroke-width="4"/>
</svg>`

const OG = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 1200px; height: 630px;
  display: flex; align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: linear-gradient(135deg, #e8dcff 0%, #c9b3ea 100%);
  color: #3f3355;
}
.wrap { display: flex; align-items: center; gap: 48px; padding: 0 96px; }
.logo { width: 148px; height: 148px; flex: none; filter: drop-shadow(0 12px 30px rgba(63,51,85,0.18)); }
h1 { font-size: 76px; line-height: 1.02; letter-spacing: -0.03em; margin-bottom: 22px; }
p { font-size: 31px; line-height: 1.4; color: rgba(63,51,85,0.75); max-width: 720px; }
</style></head><body>
<div class="wrap">
<svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<rect width="100" height="100" rx="20" fill="#ffffff"/>
<path d="M30 25h28l12 12v40H30z" fill="#8b6fb8"/>
<path d="M58 27v12h12" fill="none" stroke="#ffffff" stroke-width="4"/>
</svg>
<div>
<h1>Επιδιόρθωση PDF</h1>
<p>Repair broken PDFs in your browser. Nothing leaves your device.</p>
</div>
</div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()

async function screenshotIcon(size, file) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<!doctype html><style>*{margin:0}html,body{width:${size}px;height:${size}px}svg{display:block;width:100%;height:100%}</style>${ICON}`,
  )
  await page.screenshot({ path: join(out, file) })
}

await screenshotIcon(512, 'icon-512.png')
await screenshotIcon(192, 'icon-192.png')
await screenshotIcon(180, 'apple-touch-icon.png')

await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(OG)
await page.screenshot({ path: join(out, 'og-image.png') })

await browser.close()
console.log('wrote public/og-image.png, icon-512.png, icon-192.png, apple-touch-icon.png')
