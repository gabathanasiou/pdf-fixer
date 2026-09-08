const COLORS = ['#cbb7e8', '#9ed9b5', '#f6c177', '#9ec8f0', '#f4a6bf', '#b8e0d2']
const COUNT = 30

let layer: HTMLElement | undefined

function getLayer(): HTMLElement {
  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'confetti-layer'
    document.body.appendChild(layer)
  }
  return layer
}

export function confetti(host: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const rect = host.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const root = getLayer()

  for (let i = 0; i < COUNT; i++) {
    const piece = document.createElement('span')
    piece.className = i % 3 === 0 ? 'confetti-piece round' : 'confetti-piece'
    piece.style.left = `${cx}px`
    piece.style.top = `${cy}px`
    piece.style.backgroundColor = COLORS[i % COLORS.length]
    piece.style.setProperty('--w', `${4 + Math.random() * 6}px`)
    piece.style.setProperty('--h', `${6 + Math.random() * 8}px`)

    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.6
    const distance = 70 + Math.random() * 90
    piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`)
    piece.style.setProperty('--dy', `${Math.sin(angle) * distance}px`)
    piece.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`)
    piece.style.setProperty('--dur', `${0.8 + Math.random() * 0.5}s`)
    piece.style.animationDelay = `${Math.random() * 80}ms`
    root.appendChild(piece)
    piece.addEventListener('animationend', () => piece.remove(), { once: true })
  }
}
