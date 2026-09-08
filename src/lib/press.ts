import { tap } from './sound'

export function press(element: HTMLElement): void {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'ease-out' },
    )
  }
  tap()
}
