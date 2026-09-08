import { t } from '../i18n'
import { el } from '../lib/dom'

export type FilesHandler = (files: FileList | Iterable<File>) => void

export function DropZone(onFiles: FilesHandler): HTMLElement {
  const input = el('input', {
    id: 'file',
    attrs: { type: 'file', accept: 'application/pdf,.pdf', multiple: '', hidden: '' },
  })

  input.addEventListener('change', () => {
    if (input.files) onFiles(input.files)
    input.value = ''
  })

  return el(
    'section',
    {
      class: 'drop',
      attrs: {
        id: 'drop',
        role: 'button',
        tabindex: '0',
        'data-i18n-aria': 'dropAria',
        'aria-label': t('dropAria'),
      },
      on: {
        click: () => input.click(),
        keydown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            input.click()
          }
        },
        dragover: (event) => {
          event.preventDefault()
          const zone = event.currentTarget as HTMLElement
          zone.classList.add('hover')
        },
        dragleave: (event) => {
          const zone = event.currentTarget as HTMLElement
          zone.classList.remove('hover')
        },
        drop: (event) => {
          event.preventDefault()
          const zone = event.currentTarget as HTMLElement
          zone.classList.remove('hover')
          if (event.dataTransfer) onFiles(event.dataTransfer.files)
        },
      },
    },
    [
      el('div', { class: 'drop-inner' }, [
        el('div', { class: 'drop-icon', text: '⇪', attrs: { 'aria-hidden': 'true' } }),
        el('p', {
          class: 'drop-title',
          text: t('dropTitle'),
          attrs: { 'data-i18n': 'dropTitle' },
        }),
        el('p', { class: 'drop-sub', text: t('dropSub'), attrs: { 'data-i18n': 'dropSub' } }),
        input,
      ]),
    ],
  )
}
