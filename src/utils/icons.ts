/** Icon ids offered by the picker — matches ICON_BODIES in components/icons/TaskIcon. */
export const TASK_ICONS: string[] = [
  'pin',
  'basket',
  'laptop',
  'books',
  'dumbbell',
  'cart',
  'broom',
  'file',
  'bank',
  'pan',
  'bed',
  'book',
  'shower',
  'pill',
  'car',
  'paw',
  'sprout',
  'ball',
  'gift',
  'brain',
  'coffee',
]

export const DEFAULT_TASK_ICON = 'pin'

/** `leaf` is decorative only (empty states), so it stays out of TASK_ICONS. */
const KNOWN_IDS = new Set([...TASK_ICONS, 'leaf'])

const VS16 = '\uFE0F'

/** Legacy emoji stored before the SVG icon set, mapped onto the new ids. */
const BASE_EMOJI_TO_ID: Record<string, string> = {
  '\u{1F4CC}': 'pin',
  '\u{1F9FA}': 'basket',
  '\u{1F4BB}': 'laptop',
  '\u{1F4DA}': 'books',
  '\u{1F3CB}': 'dumbbell',
  '\u{1F6D2}': 'cart',
  '\u{1F9F9}': 'broom',
  '\u{1F4C4}': 'file',
  '\u{1F3E6}': 'bank',
  '\u{1F373}': 'pan',
  '\u{1F6CF}': 'bed',
  '\u{1F4D6}': 'book',
  '\u{1F6BF}': 'shower',
  '\u{1F48A}': 'pill',
  '\u{1F697}': 'car',
  '\u{1F415}': 'paw',
  '\u{1F331}': 'sprout',
  '\u{26BD}': 'ball',
  '\u{1F381}': 'gift',
  '\u{1F9E0}': 'brain',
  '\u{2615}': 'coffee',
  '\u{1F33F}': 'leaf',
}

/** Same map with and without the emoji variation selector (U+FE0F). */
const EMOJI_TO_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const [emoji, id] of Object.entries(BASE_EMOJI_TO_ID)) {
    const bare = emoji.replace(/\uFE0F/g, '')
    map[emoji] = id
    map[bare] = id
    map[`${bare}${VS16}`] = id
  }
  return map
})()

/**
 * Normalises any stored/typed icon into a known icon id.
 * Legacy emoji are translated; anything else falls back to the default.
 */
export function normalizeIcon(icon?: string | null): string {
  const trimmed = icon?.trim()
  if (!trimmed) return DEFAULT_TASK_ICON
  if (KNOWN_IDS.has(trimmed)) return trimmed
  return EMOJI_TO_ID[trimmed] ?? EMOJI_TO_ID[trimmed.replace(/\uFE0F/g, '')] ?? DEFAULT_TASK_ICON
}
