export type AccentColor = 'blue' | 'green' | 'red' | 'yellow' | 'brown' | 'pink'

/** Cores predefinidas de destaque — o azul é o padrão. */
export const ACCENT_OPTIONS: { value: AccentColor; label: string; swatch: string }[] = [
  { value: 'blue', label: 'Azul', swatch: '#2f6fed' },
  { value: 'green', label: 'Verde', swatch: '#16a34a' },
  { value: 'red', label: 'Vermelho', swatch: '#dc2626' },
  { value: 'yellow', label: 'Amarelo', swatch: '#eab308' },
  { value: 'brown', label: 'Marrom', swatch: '#8b5a2b' },
  { value: 'pink', label: 'Rosa', swatch: '#db2777' },
]

export const DEFAULT_ACCENT: AccentColor = 'blue'

export function isAccentColor(value: unknown): value is AccentColor {
  return ACCENT_OPTIONS.some((option) => option.value === value)
}
