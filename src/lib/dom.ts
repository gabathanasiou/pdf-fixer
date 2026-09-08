type EventHandlers = {
  [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void
}

export interface ElOptions {
  id?: string
  class?: string
  text?: string
  attrs?: Record<string, string>
  on?: EventHandlers
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElOptions = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)

  if (options.id) node.id = options.id
  if (options.class) node.className = options.class
  if (options.text !== undefined) node.textContent = options.text

  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    node.setAttribute(name, value)
  }

  for (const [type, handler] of Object.entries(options.on ?? {})) {
    if (handler) node.addEventListener(type, handler as EventListener)
  }

  for (const child of children) node.append(child)

  return node
}
