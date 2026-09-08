import * as mupdf from 'mupdf'
import './style.css'

const drop = document.getElementById('drop') as HTMLElement
const fileInput = document.getElementById('file') as HTMLInputElement
const listEl = document.getElementById('list') as HTMLElement
const autoEl = document.getElementById('auto') as HTMLInputElement

let openLogs: string[] = []
mupdf.setLog((message) => openLogs.push(String(message)))

const AUTO_KEY = 'pdf-fixer:auto-download'
try {
  autoEl.checked = localStorage.getItem(AUTO_KEY) === '1'
} catch {
  autoEl.checked = false
}
autoEl.addEventListener('change', () => {
  try {
    localStorage.setItem(AUTO_KEY, autoEl.checked ? '1' : '0')
  } catch {
    /* ignore */
  }
})

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
  trackEl: HTMLElement
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

  return { el, badgeEl, metaEl, trackEl: bar, barEl: fill }
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
  view.trackEl.style.display = "none"
}

function setClean(view: RowView, pages: number): void {
  view.badgeEl.className = 'badge clean'
  view.badgeEl.textContent = 'Καλό PDF'
  view.metaEl.textContent = `${pages} σελίδες`
  view.trackEl.style.display = "none"

  const note = document.createElement('div')
  note.className = 'fixed-note clean'
  note.textContent = 'Δεν εντοπίστηκαν προβλήματα — το αρχείο ήταν ήδη εντάξει.'
  view.metaEl.insertAdjacentElement('afterend', note)
}

function setFixed(
  view: RowView,
  pages: number,
  issues: number,
  blob: Blob,
  name: string,
): void {
  view.badgeEl.className = 'badge ok'
  view.badgeEl.textContent = 'Έτοιμο'
  view.metaEl.textContent = `${pages} σελίδες`
  view.trackEl.style.display = "none"

  if (issues > 0) {
    const note = document.createElement('div')
    note.className = 'fixed-note'
    note.textContent =
      issues === 1
        ? 'Διορθώθηκε 1 πρόβλημα στη δομή του PDF.'
        : `Διορθώθηκαν ${issues} προβλήματα στη δομή του PDF.`
    view.metaEl.insertAdjacentElement('afterend', note)
  }

  const a = document.createElement('a')
  a.className = 'dl'
  a.textContent = 'Λήψη του διορθωμένου'
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(a.href), 4000))
  view.el.appendChild(a)
}

function structuralIssueCount(bytes: Uint8Array): number {
  const s = new TextDecoder('iso-8859-1').decode(bytes)
  let issues = 0
  const eofs: number[] = []
  for (let i = 0; (i = s.indexOf('%%EOF', i)) !== -1; i += 5) eofs.push(i)
  for (let k = 0; k + 1 < eofs.length; k++) {
    if (/\S/.test(s.slice(eofs[k] + 5, eofs[k + 1]))) issues++
  }
  const sxs: number[] = []
  for (let i = 0; (i = s.indexOf('startxref', i)) !== -1; i += 9) sxs.push(i)
  for (let k = 0; k + 1 < sxs.length; k++) {
    if (/\S/.test(s.slice(sxs[k] + 9, sxs[k + 1]))) issues++
  }
  return issues
}

async function fixOne(file: File): Promise<void> {
  const view = makeRow(file.name)
  listEl.prepend(view.el)
  setBusy(view, 10)

  try {
    openLogs = []
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

    const openIssues = openLogs.length
    const issues =
      structuralIssueCount(new Uint8Array(buf)) + openIssues + (pdf.wasRepaired() ? 1 : 0)

    if (issues === 0) {
      setClean(view, pages)
      doc.destroy()
      return
    }

    const out = pdf.saveToBuffer('compress,garbage=4,clean').asUint8Array()
    const blob = new Blob([out], { type: 'application/pdf' })

    setFixed(view, pages, issues, blob, outputName(file.name))
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