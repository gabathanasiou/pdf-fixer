import { getLang, setLang, t } from '../i18n'
import { el } from '../lib/dom'
import { FLAGS, otherLang } from '../lib/flags'
import { soundOffIcon, soundOnIcon } from '../lib/icons'
import { isSoundOn, tick, toggleSound } from '../lib/sound'

export function Header(onInfo: () => void): HTMLElement {
  const info = el('button', {
    class: 'pill-btn',
    text: t('infoButton'),
    attrs: { type: 'button', 'data-i18n': 'infoButton' },
    on: {
      click: () => {
        tick()
        onInfo()
      },
    },
  })

  const sound = el(
    'button',
    {
      class: 'icon-btn',
      attrs: { type: 'button', 'data-i18n-aria': 'soundAria', 'aria-label': t('soundAria') },
      on: {
        click: () => {
          const on = toggleSound()
          sound.replaceChildren(on ? soundOnIcon() : soundOffIcon())
        },
      },
    },
    [isSoundOn() ? soundOnIcon() : soundOffIcon()],
  )

  const toggle = el(
    'button',
    {
      class: 'pill-btn lang',
      attrs: {
        id: 'lang',
        type: 'button',
        'data-i18n-aria': 'langAria',
        'aria-label': t('langAria'),
      },
      on: {
        click: () => {
          tick()
          setLang(otherLang(getLang()))
        },
      },
    },
    [
      el('img', {
        class: 'flag flag-el',
        attrs: { src: FLAGS.el, alt: '', width: '22', height: '15' },
      }),
      el('img', {
        class: 'flag flag-en',
        attrs: { src: FLAGS.en, alt: '', width: '22', height: '15' },
      }),
      el('span', { text: t('langButton'), attrs: { 'data-i18n': 'langButton' } }),
    ],
  )

  return el('header', {}, [
    el('div', { class: 'head-row' }, [
      el('h1', { text: t('title'), attrs: { 'data-i18n': 'title' } }),
      el('div', { class: 'head-actions' }, [info, sound, toggle]),
    ]),
  ])
}
