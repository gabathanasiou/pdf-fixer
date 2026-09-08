import { t } from '../i18n'
import { el } from '../lib/dom'
import { documentIcon } from '../lib/icons'
import { chord } from '../lib/sound'
import { ResultRow } from './result-row'

export interface ResultList {
  el: HTMLElement
  add(name: string, source?: HTMLElement): ResultRow
}

export function ResultList(): ResultList {
  const empty = el('div', { class: 'list-empty' }, [
    documentIcon(),
    el('p', {
      class: 'list-empty-text',
      text: t('emptyHint'),
      attrs: { 'data-i18n': 'emptyHint' },
    }),
  ])

  const root = el('section', { class: 'list', attrs: { id: 'list', 'aria-live': 'polite' } }, [
    empty,
  ])

  return {
    el: root,
    add(name, source) {
      empty.hidden = true

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const existing = reduced ? [] : Array.from(root.querySelectorAll<HTMLElement>('.row'))
      const before = existing.map((node) => node.getBoundingClientRect().top)

      const row = ResultRow(name)
      root.prepend(row.el)
      row.el.classList.add('reveal')
      chord()

      existing.forEach((node, index) => {
        const delta = before[index] - node.getBoundingClientRect().top
        if (!delta) return
        node.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
          { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        )
      })

      if (!reduced) {
        const to = row.el.getBoundingClientRect()
        const from = source && !source.hidden ? source.getBoundingClientRect() : null
        const dx = from ? Math.sign(from.left - to.left) * 14 : 0
        row.el.animate(
          [
            { transform: `translate(${dx}px, -16px) scale(0.97)`, opacity: 0 },
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          ],
          { duration: 460, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
        )
      }

      return row
    },
  }
}
