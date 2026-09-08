import { onLangChange, t } from '../i18n'
import { el } from '../lib/dom'
import { clearHistory, deleteHistory, loadHistory, type RepairRecord } from '../lib/history'
import { trashIcon } from '../lib/icons'
import { press } from '../lib/press'
import { tap } from '../lib/sound'

export interface HistoryList {
  el: HTMLElement
  refresh(): Promise<void>
}

const SPIN_MS = 450

function playSpinOut(card: HTMLElement, delay = 0): Promise<void> {
  return new Promise((resolve) => {
    card.style.animationDelay = `${delay}ms`
    card.classList.add('deleting')
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    card.addEventListener('animationend', finish, { once: true })
    setTimeout(finish, SPIN_MS + delay + 150)
  })
}

export function HistoryList(
  isCurrent: (id: string) => boolean,
  onExpired: () => void,
  confirm: (action: () => void) => void,
): HistoryList {
  const items = el('div', { class: 'history-items' })
  const root = el('section', { class: 'history', attrs: { hidden: '' } }, [
    el('div', { class: 'history-head' }, [
      el('h2', {
        class: 'history-title',
        text: t('recentTitle'),
        attrs: { 'data-i18n': 'recentTitle' },
      }),
      el(
        'button',
        {
          class: 'history-clear',
          attrs: { type: 'button', 'data-i18n-aria': 'clearAria', 'aria-label': t('clearAria') },
          on: {
            click: (event) => {
              press(event.currentTarget as HTMLElement)
              confirm(() => void clear())
            },
          },
        },
        [trashIcon()],
      ),
    ]),
    el('p', {
      class: 'history-note',
      text: t('historyNote'),
      attrs: { 'data-i18n': 'historyNote' },
    }),
    items,
  ])

  let urls: string[] = []

  async function clear(): Promise<void> {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cards = [...items.querySelectorAll<HTMLElement>('.row')]
    if (!reduced) {
      await Promise.all(cards.map((card, index) => playSpinOut(card, index * 60)))
    }
    try {
      await clearHistory()
    } catch {
      /* ignore */
    }
    await refresh()
  }

  async function removeCard(card: HTMLElement, id: string): Promise<void> {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced) await playSpinOut(card)

    const others = [...items.querySelectorAll<HTMLElement>('.row')].filter((node) => node !== card)
    const before = others.map((node) => node.getBoundingClientRect().top)
    card.remove()
    if (!items.querySelector('.row')) root.hidden = true

    if (!reduced) {
      others.forEach((node, index) => {
        const delta = before[index] - node.getBoundingClientRect().top
        if (delta) {
          node.animate(
            [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
            { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          )
        }
      })
    }

    try {
      await deleteHistory(id)
    } catch {
      /* ignore */
    }
  }

  function render(record: RepairRecord): HTMLElement {
    const remove = el(
      'button',
      {
        class: 'history-delete',
        attrs: { type: 'button', 'data-i18n-aria': 'deleteAria', 'aria-label': t('deleteAria') },
        on: {
          click: (event) => {
            press(event.currentTarget as HTMLElement)
            const card = (event.currentTarget as HTMLElement).closest<HTMLElement>('.row')
            if (card) void removeCard(card, record.id)
          },
        },
      },
      [trashIcon()],
    )

    const children: Node[] = [
      el('div', { class: 'history-badge-row' }, [
        el('span', { class: 'badge ok', text: t('ready') }),
        remove,
      ]),
      el('div', { class: 'row-top' }, [
        el('div', { class: 'row-title' }, [
          el('div', { class: 'row-name', text: record.name }),
          ...(record.pages !== undefined
            ? [el('span', { class: 'row-pages', text: t('pages', { count: record.pages }) })]
            : []),
        ]),
      ]),
      el('div', {
        class: 'fixed-note',
        text:
          record.issues === 1
            ? t('fixedOne')
            : t('fixedMany', { count: record.issues ?? 0 }),
      }),
    ]

    if (record.blob) {
      const url = URL.createObjectURL(record.blob)
      urls.push(url)
      children.push(
        el('a', {
          class: 'dl',
          text: t('download'),
          attrs: { href: url, download: record.name },
          on: {
            click: () => {
              tap()
              setTimeout(() => URL.revokeObjectURL(url), 4000)
            },
          },
        }),
      )
    } else {
      children.push(
        el('button', {
          class: 'history-expired',
          text: t('expiredButton'),
          attrs: { type: 'button' },
          on: {
            click: (event) => {
              press(event.currentTarget as HTMLElement)
              onExpired()
            },
          },
        }),
      )
    }

    return el('div', { class: 'row' }, children)
  }

  async function refresh(): Promise<void> {
    urls.forEach((url) => URL.revokeObjectURL(url))
    urls = []

    let records: RepairRecord[] = []
    try {
      records = (await loadHistory()).filter(
        (record) => record.kind === 'fixed' && !isCurrent(record.id),
      )
    } catch {
      records = []
    }
    root.hidden = records.length === 0
    items.replaceChildren(...records.map(render))
  }

  onLangChange(() => void refresh())
  void refresh()

  return { el: root, refresh }
}
