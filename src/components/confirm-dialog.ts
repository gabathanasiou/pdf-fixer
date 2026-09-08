import { t } from '../i18n'
import { el } from '../lib/dom'
import { tap, tick } from '../lib/sound'

export interface ConfirmDialog {
  el: HTMLElement
  open(action: () => void): void
}

export function ConfirmDialog(): ConfirmDialog {
  let action: (() => void) | null = null
  let previouslyFocused: HTMLElement | null = null

  const title = el('h2', {
    text: t('clearTitle'),
    attrs: { id: 'confirm-title', 'data-i18n': 'clearTitle' },
  })
  const body = el('p', {
    class: 'message-text',
    text: t('clearMessage'),
    attrs: { 'data-i18n': 'clearMessage' },
  })
  const cancel = el('button', {
    class: 'pill-btn',
    text: t('cancel'),
    attrs: { type: 'button', 'data-i18n': 'cancel' },
    on: { click: () => { tick(); close() } },
  })
  const confirm = el('button', {
    class: 'pill-btn danger',
    text: t('confirmDelete'),
    attrs: { type: 'button', 'data-i18n': 'confirmDelete' },
    on: {
      click: () => {
        tap()
        const run = action
        close()
        run?.()
      },
    },
  })

  const dialog = el(
    'div',
    {
      class: 'info-dialog',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title' },
    },
    [
      el('div', { class: 'info-head' }, [title]),
      body,
      el('div', { class: 'message-actions' }, [cancel, confirm]),
    ],
  )

  const overlay = el(
    'div',
    {
      class: 'info-overlay',
      attrs: { hidden: '' },
      on: {
        click: (event) => {
          if (event.target === overlay) {
            tick()
            close()
          }
        },
      },
    },
    [dialog],
  )

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  function open(run: () => void): void {
    action = run
    previouslyFocused = document.activeElement as HTMLElement | null
    overlay.removeAttribute('hidden')
    document.body.classList.add('info-open')
    document.addEventListener('keydown', onKeydown)
    confirm.focus()
  }

  function close(): void {
    overlay.setAttribute('hidden', '')
    document.body.classList.remove('info-open')
    document.removeEventListener('keydown', onKeydown)
    previouslyFocused?.focus()
  }

  return { el: overlay, open }
}
