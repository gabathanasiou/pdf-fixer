import { t } from '../i18n'
import { el } from '../lib/dom'
import { closeIcon } from '../lib/icons'
import { tick } from '../lib/sound'

export interface InfoDialog {
  el: HTMLElement
  open(): void
  close(): void
}

function section(titleKey: Parameters<typeof t>[0], items: Array<Parameters<typeof t>[0]>): HTMLElement[] {
  return [
    el('h3', { text: t(titleKey), attrs: { 'data-i18n': titleKey } }),
    el(
      'ul',
      {},
      items.map((key) => el('li', { text: t(key), attrs: { 'data-i18n': key } })),
    ),
  ]
}

export function InfoDialog(): InfoDialog {
  let previouslyFocused: HTMLElement | null = null

  const closeBtn = el(
    'button',
    {
      class: 'icon-btn info-close',
      attrs: { type: 'button', 'data-i18n-aria': 'infoClose', 'aria-label': t('infoClose') },
      on: { click: () => { tick(); close() } },
    },
    [closeIcon()],
  )

  const body = el('div', { class: 'info-body' }, [
    el('p', { text: t('infoIntro'), attrs: { 'data-i18n': 'infoIntro' } }),
    el('h3', { text: t('infoWhyTitle'), attrs: { 'data-i18n': 'infoWhyTitle' } }),
    el('p', { text: t('infoWhy'), attrs: { 'data-i18n': 'infoWhy' } }),
    el('h3', { text: t('infoFixTitle'), attrs: { 'data-i18n': 'infoFixTitle' } }),
    el('ul', {}, [
      el('li', { text: t('infoFix1'), attrs: { 'data-i18n': 'infoFix1' } }),
      el('li', { text: t('infoFix2'), attrs: { 'data-i18n': 'infoFix2' } }),
      el('li', { text: t('infoFix3'), attrs: { 'data-i18n': 'infoFix3' } }),
      el('li', { text: t('infoFix4'), attrs: { 'data-i18n': 'infoFix4' } }),
    ]),
    el('h3', { text: t('infoPrivacyTitle'), attrs: { 'data-i18n': 'infoPrivacyTitle' } }),
    el('p', { text: t('infoPrivacy'), attrs: { 'data-i18n': 'infoPrivacy' } }),
    ...section('infoHowTitle', ['infoHow1', 'infoHow2', 'infoHow3']),
    ...section('infoNoteTitle', ['infoNote1', 'infoNote2', 'infoNote3']),
    el('h3', { text: t('infoStoryTitle'), attrs: { 'data-i18n': 'infoStoryTitle' } }),
    el('p', { text: t('infoStory'), attrs: { 'data-i18n': 'infoStory' } }),
  ])

  const dialog = el(
    'div',
    {
      class: 'info-dialog',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'info-title' },
    },
    [
      el('div', { class: 'info-head' }, [
        el('h2', { id: 'info-title', text: t('infoTitle'), attrs: { 'data-i18n': 'infoTitle' } }),
        closeBtn,
      ]),
      body,
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
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      closeBtn.focus()
    }
  }

  function open(): void {
    previouslyFocused = document.activeElement as HTMLElement | null
    overlay.removeAttribute('hidden')
    document.body.classList.add('info-open')
    document.addEventListener('keydown', onKeydown)
    closeBtn.focus()
  }

  function close(): void {
    overlay.setAttribute('hidden', '')
    document.body.classList.remove('info-open')
    document.removeEventListener('keydown', onKeydown)
    previouslyFocused?.focus()
  }

  return { el: overlay, open, close }
}
