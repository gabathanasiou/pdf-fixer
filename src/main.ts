import * as mupdf from 'mupdf'
import './style.css'

const drop = document.getElementById('drop') as HTMLElement
const fileInput = document.getElementById('file') as HTMLInputElement
const listEl = document.getElementById('list') as HTMLElement
const autoEl = document.getElementById('auto') as HTMLInputElement

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

function outputName(name: string): string {
  return name.replace(/\.pdf$/i, '') + '-fixed.pdf'
}

function triggerDownload(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

interface RowView {
  el: HTMLElement
  badgeEl: HTMLElement
  metaEl: HTMLElement
  barEl: HTMLElement
}

function makeRow(name: string): RowView {
  const el = document.createElement('div')
  el.className = 'row'

  const top = document.createElement('div')
  top.className = 'row-top'

  const nameEl = document.createElement('div')
  nameEl.className = 'row-name'
  nameEl.textContent = name

  const badgeEl = document.createElement('span')
  badgeEl.className = 'badge busy'
  badgeEl.textContent = 'Σε εξέλιξη…'

  top.append(nameEl, badgeEl)

  const metaEl = document.createElement('div')
  metaEl.className = 'row-meta'

  const bar = document.createElement('div')
  bar.className = 'progress'
  const fill = document.createElement('div')
  bar.appendChild(fill)

  el.append(top, metaEl, bar)

  return { el, badgeEl, metaEl, barEl: fill }
}

function setBusy(view: RowView, pct: number): void {
  view.badgeEl.className = 'badge busy'
  view.badgeEl.textContent = 'Επιδιόρθωση…'
  view.barEl.style.width = `${pct}%`
}

function setError(view: RowView, message: string): void {
  view.badgeEl.className = 'badge err'
  view.badgeEl.textContent = 'Δεν τα κατάφερε'
  view.metaEl.textContent = message
  view.barEl.style.display = 'none'
}

function setDone(view: RowView, pages: number, inBytes: number, outBytes: number, blob: Blob, name: string): void {
  view.badgeEl.className = 'badge ok'
  view.badgeEl.textContent = 'Έτοιμο'
  view.metaEl.textContent = `${pages} σελίδες · ${fmt(inBytes)} → ${fmt(outBytes)}`

  const a = document.createElement('a')
  a.className = 'dl'
  a.textContent = 'Λήψη του διορθωμένου'
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(a.href), 4000))
  view.el.appendChild(a)
}

async function fixOne(file: File): Promise<void> {
  const view = makeRow(file.name)
  listEl.prepend(view.el)
  setBusy(view, 10)

  try {
    const buf = await file.arrayBuffer()
    setBusy(view, 45)

    const doc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf')
    if (!doc.isPDF() || !doc.asPDF()) {
      setError(view, 'Αυτό το αρχείο δεν είναι PDF (ή είναι κρυπτογραφημένο).')
      doc.destroy()
      return
    }
    const pdf = doc.asPDF()!

    const pages = doc.countPages()
    setBusy(view, 70)

    const out = pdf.saveToBuffer('compress,garbage=4,clean').asUint8Array()
    const outBytes = out.slice().byteLength
    const blob = new Blob([out], { type: 'application/pdf' })

    setDone(view, pages, buf.byteLength, outBytes, blob, outputName(file.name))
    doc.destroy()

    if (autoEl.checked) triggerDownload(blob, outputName(file.name))
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    setError(view, `Σφάλμα: ${msg}`)
  }
}

function handleFiles(files: FileList | Iterable<File>): void {
  const pdfs = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
  if (pdfs.length === 0) return
  ;(async () => {
    for (const f of pdfs) {
      await fixOne(f)
      await new Promise((r) => setTimeout(r, 30))
    }
  })()
}

drop.addEventListener('click', () => fileInput.click())
drop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fileInput.click()
  }
})
fileInput.addEventListener('change', () => {
  if (fileInput.files) handleFiles(fileInput.files)
  fileInput.value = ''
})

drop.addEventListener('dragover', (e) => {
  e.preventDefault()
  drop.classList.add('hover')
})
drop.addEventListener('dragleave', () => drop.classList.remove('hover'))
drop.addEventListener('drop', (e) => {
  e.preventDefault()
  drop.classList.remove('hover')
  if (e.dataTransfer) handleFiles(e.dataTransfer.files)
})

window.__pdfFixerReady = true