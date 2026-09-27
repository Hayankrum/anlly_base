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

/** Cores fixas das categorias sugeridas no formulário (chave sem acento/caixa). */
const CATEGORY_COLORS: Record<string, string> = {
  casa: '#f76b15',
  estudos: '#8e4ec6',
  trabalho: '#2f6fed',
  pessoal: '#d6409f',
  saude: '#30a46c',
  financeiro: '#e8b923',
  lazer: '#0e9fca',
  compras: '#e5484d',
}

function foldKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * A cor do afazer vem da categoria: as categorias sugeridas têm cor própria
 * e qualquer nome digitado recebe uma cor estável calculada do próprio nome.
 */
export function colorForCategory(category?: string | null): string {
  const name = category?.trim()
  if (!name) return DEFAULT_EVENT_COLOR
  const fixed = CATEGORY_COLORS[foldKey(name)]
  if (fixed) return fixed
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  const index = Math.abs(hash) % EVENT_COLORS.length
  return EVENT_COLORS[index].value
}
