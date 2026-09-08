import * as mupdf from 'mupdf'
import { outputName } from './download'

export type RepairProgress = (pct: number) => void

export type RepairResult =
  | { status: 'clean'; pages: number }
  | { status: 'fixed'; pages: number; issues: number; blob: Blob; name: string }
  | { status: 'error'; message: string; notPdf: boolean }

let openLogs: string[] = []
mupdf.setLog((message) => openLogs.push(String(message)))

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

export async function repairPdf(file: File, onProgress?: RepairProgress): Promise<RepairResult> {
  try {
    openLogs = []
    onProgress?.(10)

    const buf = await file.arrayBuffer()
    onProgress?.(45)

    const doc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf')
    if (!doc.isPDF() || !doc.asPDF()) {
      doc.destroy()
      return { status: 'error', message: '', notPdf: true }
    }
    const pdf = doc.asPDF()!

    const pages = doc.countPages()
    onProgress?.(70)

    const issues =
      structuralIssueCount(new Uint8Array(buf)) + openLogs.length + (pdf.wasRepaired() ? 1 : 0)

    if (issues === 0) {
      doc.destroy()
      return { status: 'clean', pages }
    }

    const out = pdf.saveToBuffer('compress,garbage=4,clean').asUint8Array()
    const blob = new Blob([out as BlobPart], { type: 'application/pdf' })
    doc.destroy()

    return { status: 'fixed', pages, issues, blob, name: outputName(file.name) }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { status: 'error', message, notPdf: false }
  }
}
