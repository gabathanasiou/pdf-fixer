import { t } from '../i18n'
import { el } from '../lib/dom'

export function Intro(): HTMLElement {
  return el('p', { class: 'sub', text: t('subtitle'), attrs: { 'data-i18n': 'subtitle' } })
}
