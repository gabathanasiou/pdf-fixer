import { t } from '../i18n'
import { el } from '../lib/dom'
import { flip } from '../lib/sound'

const AUTO_KEY = 'pdf-fixer:auto-download'

export interface AutoDownloadToggle {
  el: HTMLElement
  isChecked(): boolean
}

export function AutoDownload(): AutoDownloadToggle {
  const input = el('input', { id: 'auto', attrs: { type: 'checkbox' } })

  try {
    input.checked = localStorage.getItem(AUTO_KEY) === '1'
  } catch {
    input.checked = false
  }

  input.addEventListener('change', () => {
    flip(input.checked)
    try {
      localStorage.setItem(AUTO_KEY, input.checked ? '1' : '0')
    } catch {
      /* ignore */
    }
  })

  const label = el('label', { class: 'auto' }, [
    input,
    el('span', { text: t('autoDownload'), attrs: { 'data-i18n': 'autoDownload' } }),
  ])

  return { el: label, isChecked: () => input.checked }
}
