interface EventColor {
  name: string
  value: string
}

export const EVENT_COLORS: EventColor[] = [
  { name: 'Azul', value: '#2f6fed' },
  { name: 'Vermelho', value: '#e5484d' },
  { name: 'Verde', value: '#30a46c' },
  { name: 'Laranja', value: '#f76b15' },
  { name: 'Roxo', value: '#8e4ec6' },
  { name: 'Rosa', value: '#d6409f' },
  { name: 'Ciano', value: '#0e9fca' },
  { name: 'Amarelo', value: '#e8b923' },
]

export const DEFAULT_EVENT_COLOR = EVENT_COLORS[0].value

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Accepts only palette/valid hex colors, otherwise the default blue. */
export function normalizeColor(color?: string | null): string {
  return color && HEX_RE.test(color) ? color.toLowerCase() : DEFAULT_EVENT_COLOR
}
