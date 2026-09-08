const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(attrs: Record<string, string>, children: SVGElement[]): SVGElement {
  const node = document.createElementNS(SVG_NS, 'svg')
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  for (const child of children) node.appendChild(child)
  return node
}

function shape(tag: string, attrs: Record<string, string>): SVGElement {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

function icon(children: SVGElement[]): SVGElement {
  return svg(
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      class: 'icon',
    },
    children,
  )
}

export function closeIcon(): SVGElement {
  return icon([
    shape('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    shape('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
  ])
}

export function documentIcon(): SVGElement {
  return icon([
    shape('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
    shape('polyline', { points: '14 2 14 8 20 8' }),
  ])
}

export function soundOnIcon(): SVGElement {
  return icon([
    shape('polygon', { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }),
    shape('path', { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' }),
    shape('path', { d: 'M19.07 4.93a10 10 0 0 1 0 14.14' }),
  ])
}

export function soundOffIcon(): SVGElement {
  return icon([
    shape('polygon', { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }),
    shape('line', { x1: '23', y1: '9', x2: '17', y2: '15' }),
    shape('line', { x1: '17', y1: '9', x2: '23', y2: '15' }),
  ])
}
