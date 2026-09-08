import { t } from '../i18n'
import { el } from '../lib/dom'

export interface ExpiredDialog {
  el: HTMLElement
  open(): void
}

export function ExpiredDialog(): ExpiredDialog {
  let previouslyFocused: HTMLElement | null = null

  const title = el('h2', {
    text: t('expiredTitle'),
    attrs: { id: 'expired-title', 'data-i18n': 'expiredTitle' },
  })
  const body = el('p', {
    class: 'message-text',
    text: t('expiredMessage'),
    attrs: { 'data-i18n': 'expiredMessage' },
  })
  const ok = el('button', {
    class: 'pill-btn',
    text: t('ok'),
    attrs: { type: 'button', 'data-i18n': 'ok' },
    on: { click: () => close() },
  })

  const dialog = el(
    'div',
    {
      class: 'info-dialog',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'expired-title' },
    },
    [
      el('div', { class: 'info-head' }, [title]),
      body,
      el('div', { class: 'message-actions' }, [ok]),
    ],
  )

  const overlay = el(
    'div',
    {
      class: 'info-overlay',
      attrs: { hidden: '' },
      on: {
        click: (event) => {
          if (event.target === overlay) close()
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

  function open(): void {
    previouslyFocused = document.activeElement as HTMLElement | null
    overlay.removeAttribute('hidden')
    document.body.classList.add('info-open')
    document.addEventListener('keydown', onKeydown)
    ok.focus()
  }

  function close(): void {
    overlay.setAttribute('hidden', '')
    document.body.classList.remove('info-open')
    document.removeEventListener('keydown', onKeydown)
    previouslyFocused?.focus()
  }

  return { el: overlay, open }
}
