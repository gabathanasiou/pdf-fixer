import { onLangChange, t } from '../i18n'
import { confetti } from '../lib/confetti'
import { el } from '../lib/dom'
import { clean as cleanSound, error as errorSound, success } from '../lib/sound'

type RowState =
  | { kind: 'busy'; repairing: boolean }
  | { kind: 'error'; notPdf: boolean; message: string }
  | { kind: 'clean'; pages: number }
  | { kind: 'fixed'; pages: number; issues: number; blob: Blob; name: string }

export interface ResultRow {
  el: HTMLElement
  setBusy(): void
  complete(): Promise<void>
  setError(message: string, notPdf?: boolean): void
  setClean(pages: number): void
  setFixed(pages: number, issues: number, blob: Blob, name: string): void
  settled(): Promise<void>
  destroy(): void
}

const PROGRESS_MS = 550

export function ResultRow(name: string): ResultRow {
  const pages = el('span', { class: 'row-pages' })
  const badge = el('span', { class: 'badge busy' })
  const meta = el('div', { class: 'row-meta', attrs: { hidden: '' } })
  const fill = el('div')
  const track = el('div', { class: 'progress' }, [fill])

  const root = el('div', { class: 'row' }, [
    el('div', { class: 'row-top' }, [
      el('div', { class: 'row-title' }, [
        el('div', { class: 'row-name', text: name }),
        pages,
      ]),
      badge,
    ]),
    meta,
    track,
  ])

  let state: RowState = { kind: 'busy', repairing: false }
  let downloadUrl: string | undefined
  let donePlayed = false
  let settle: Promise<void> = Promise.resolve()

  function playDone(kind: 'fixed' | 'clean' | 'error'): void {
    if (donePlayed) return
    donePlayed = true
    root.classList.add(`anim-${kind}`)

    const animation = new Promise<void>((resolve) => {
      root.addEventListener(
        'animationend',
        () => {
          root.style.willChange = 'auto'
          resolve()
        },
        { once: true },
      )
    })
    const soundMs = kind === 'fixed' ? 1500 : kind === 'clean' ? 950 : 450
    const sound = new Promise<void>((resolve) => setTimeout(resolve, soundMs))
    settle = Promise.all([animation, sound]).then(() => undefined)

    if (kind === 'fixed') {
      success()
      confetti(root)
    } else if (kind === 'clean') {
      cleanSound()
    } else {
      errorSound()
    }
  }

  function render(): void {
    root.querySelectorAll('.fixed-note, .dl').forEach((node) => node.remove())

    if (state.kind === 'busy') {
      badge.className = 'badge busy'
      badge.textContent = state.repairing ? t('repairing') : t('busy')
      pages.textContent = ''
      meta.textContent = ''
      meta.hidden = true
      track.style.display = ''
      return
    }

    track.style.display = 'none'

    if (state.kind === 'error') {
      badge.className = 'badge err'
      badge.textContent = t('failed')
      pages.textContent = ''
      meta.textContent = state.notPdf ? t('notPdf') : t('error', { msg: state.message })
      meta.hidden = false
      playDone('error')
      return
    }

    pages.textContent = t('pages', { count: state.pages })
    meta.textContent = ''
    meta.hidden = true
    playDone(state.kind)

    if (state.kind === 'clean') {
      badge.className = 'badge clean'
      badge.textContent = t('clean')
      const note = el('div', { class: 'fixed-note clean', text: t('cleanNote') })
      meta.insertAdjacentElement('afterend', note)
      return
    }

    badge.className = 'badge ok'
    badge.textContent = t('ready')

    if (state.issues > 0) {
      const note = el('div', {
        class: 'fixed-note',
        text: state.issues === 1 ? t('fixedOne') : t('fixedMany', { count: state.issues }),
      })
      meta.insertAdjacentElement('afterend', note)
    }

    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    const url = URL.createObjectURL(state.blob)
    downloadUrl = url
    const link = el('a', {
      class: 'dl',
      text: t('download'),
      attrs: { href: url, download: state.name },
      on: { click: () => setTimeout(() => URL.revokeObjectURL(url), 4000) },
    })
    root.appendChild(link)
  }

  render()
  const unsubscribe = onLangChange(render)

  return {
    el: root,
    setBusy() {
      state = { kind: 'busy', repairing: true }
      render()
    },
    complete() {
      return new Promise((resolve) => {
        const current = getComputedStyle(fill).transform
        fill.style.transition = 'none'
        fill.style.transform = current
        fill.style.animation = 'none'
        void fill.offsetWidth
        fill.style.transition = ''
        fill.style.transform = 'scaleX(1)'
        setTimeout(resolve, PROGRESS_MS)
      })
    },
    setError(message, notPdf = false) {
      state = { kind: 'error', notPdf, message }
      render()
    },
    setClean(pages) {
      state = { kind: 'clean', pages }
      render()
    },
    setFixed(pages, issues, blob, name) {
      state = { kind: 'fixed', pages, issues, blob, name }
      render()
    },
    settled() {
      return settle
    },
    destroy() {
      unsubscribe()
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
      root.remove()
    },
  }
}
