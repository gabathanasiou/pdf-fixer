import './style.css'
import { AutoDownload } from './components/auto-download'
import { DropZone } from './components/drop-zone'
import { Header } from './components/header'
import { InfoDialog } from './components/info-dialog'
import { Intro } from './components/intro'
import { ResultList } from './components/result-list'
import { applyStatic, getLang, t } from './i18n'
import { triggerDownload } from './lib/download'
import { el } from './lib/dom'
import { repairPdf } from './lib/repair'

const mount = document.getElementById('app')
if (!mount) throw new Error('Missing #app mount point')

const list = ResultList()
const auto = AutoDownload()
const info = InfoDialog()

const inputPanel = el('section', { class: 'panel panel-input' }, [
  Intro(),
  DropZone(handleFiles),
  auto.el,
])
const outputPanel = el('section', { class: 'panel panel-output' }, [
  el('h2', {
    class: 'panel-title',
    text: t('resultsTitle'),
    attrs: { 'data-i18n': 'resultsTitle' },
  }),
  list.el,
])

mount.append(
  Header(() => info.open()),
  el('div', { class: 'layout' }, [inputPanel, outputPanel]),
  info.el,
)

document.documentElement.lang = getLang()
applyStatic()

function handleFiles(files: FileList | Iterable<File>): void {
  const pdfs = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
  if (pdfs.length === 0) return
  void (async () => {
    for (const file of pdfs) {
      await fixOne(file)
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
  })()
}

async function fixOne(file: File): Promise<void> {
  const row = list.add(file.name)
  row.setBusy()

  const result = await repairPdf(file)

  if (result.status === 'error') {
    row.setError(result.message, result.notPdf)
    return
  }

  await row.complete()

  if (result.status === 'clean') {
    row.setClean(result.pages)
  } else {
    row.setFixed(result.pages, result.issues, result.blob, result.name)
    if (auto.isChecked()) triggerDownload(result.blob, result.name)
  }
}

window.__pdfFixerReady = true
