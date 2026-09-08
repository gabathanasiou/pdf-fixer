import './style.css'
import { AutoDownload } from './components/auto-download'
import { ConfirmDialog } from './components/confirm-dialog'
import { DropZone } from './components/drop-zone'
import { ExpiredDialog } from './components/expired-dialog'
import { Header } from './components/header'
import { HistoryList } from './components/history-list'
import { InfoDialog } from './components/info-dialog'
import { Intro } from './components/intro'
import { ResultList } from './components/result-list'
import { applyStatic, getLang, onLangChange, t } from './i18n'
import { triggerDownload } from './lib/download'
import { el } from './lib/dom'
import { addHistory, newId } from './lib/history'
import { repairPdf } from './lib/repair'

const mount = document.getElementById('app')
if (!mount) throw new Error('Missing #app mount point')

const list = ResultList()
const auto = AutoDownload()
const info = InfoDialog()
const expired = ExpiredDialog()
const clearDialog = ConfirmDialog()
const currentIds = new Set<string>()
const history = HistoryList(
  (id) => currentIds.has(id),
  () => expired.open(),
  (action) => clearDialog.open(action),
)
list.el.appendChild(history.el)

let queueCount = 0
const queue = el('span', { class: 'queue', attrs: { hidden: '' } })

function updateQueue(count: number): void {
  queueCount = count
  queue.hidden = count <= 0
  if (count > 0) {
    queue.textContent = t('queue', { count })
    queue.animate([{ transform: 'scale(0.7)' }, { transform: 'scale(1)' }], {
      duration: 320,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    })
  }
}

const inputPanel = el('section', { class: 'panel panel-input' }, [
  Intro(),
  DropZone(handleFiles),
  auto.el,
])
const outputPanel = el('section', { class: 'panel panel-output' }, [
  el('div', { class: 'panel-head' }, [
    el('h2', {
      class: 'panel-title',
      text: t('resultsTitle'),
      attrs: { 'data-i18n': 'resultsTitle' },
    }),
    queue,
  ]),
  list.el,
])

mount.append(
  Header(() => info.open()),
  el('div', { class: 'layout' }, [inputPanel, outputPanel]),
  info.el,
  expired.el,
  clearDialog.el,
)

document.documentElement.lang = getLang()
applyStatic()
onLangChange(() => updateQueue(queueCount))

function handleFiles(files: FileList | Iterable<File>): void {
  const pdfs = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
  if (pdfs.length === 0) return
  void (async () => {
    for (let i = 0; i < pdfs.length; i++) {
      updateQueue(pdfs.length - i - 1)
      await fixOne(pdfs[i])
    }
    updateQueue(0)
  })()
}

async function fixOne(file: File): Promise<void> {
  const row = list.add(file.name, queue)
  row.setBusy()

  const result = await repairPdf(file)
  let saving: Promise<void> = Promise.resolve()

  if (result.status === 'error') {
    row.setError(result.message, result.notPdf)
    saving = record({
      name: file.name,
      kind: 'error',
      notPdf: result.notPdf,
      message: result.message,
    })
  } else {
    await row.complete()
    if (result.status === 'clean') {
      row.setClean(result.pages)
      saving = record({ name: file.name, kind: 'clean', pages: result.pages })
    } else {
      row.setFixed(result.pages, result.issues, result.blob, result.name)
      if (auto.isChecked()) triggerDownload(result.blob, result.name)
      saving = record({
        name: result.name,
        kind: 'fixed',
        blob: result.blob,
        pages: result.pages,
        issues: result.issues,
      })
    }
  }

  await row.settled()
  await saving
  await history.refresh()
}

function record(entry: {
  name: string
  kind: 'fixed' | 'clean' | 'error'
  blob?: Blob
  pages?: number
  issues?: number
  notPdf?: boolean
  message?: string
}): Promise<void> {
  const id = newId()
  currentIds.add(id)
  return addHistory({ ...entry, id, createdAt: Date.now() }).catch(() => {})
}

window.__pdfFixerReady = true
