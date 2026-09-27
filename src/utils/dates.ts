export type DateStr = string

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

/** Monday-first weekday labels (pt-BR calendar). */
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Current local date as YYYY-MM-DD. */
export function todayStr(now: Date = new Date()): DateStr {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** month is 1-based (1 = January). */
export function makeDate(year: number, month: number, day: number): DateStr {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseDate(date: string): { year: number; month: number; day: number } | null {
  const m = DATE_RE.exec(date)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12) return null
  if (day < 1 || day > getDaysInMonth(year, month)) return null
  return { year, month, day }
}

/** True when the string is a real calendar date (leap years included). */
export function isValidDate(date: string): boolean {
  return parseDate(date) !== null
}

/** DD/MM/YYYY */
export function formatDate(date: DateStr): string {
  const p = parseDate(date)
  if (!p) return date
  return `${pad2(p.day)}/${pad2(p.month)}/${p.year}`
}

/** "Outubro 2026" */
export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

/** "12 de Outubro" */
export function formatDateLong(date: DateStr): string {
  const p = parseDate(date)
  if (!p) return date
  return `${p.day} de ${MONTH_NAMES[p.month - 1]}`
}

/** Weekday index, 0 = Monday ... 6 = Sunday. */
function weekdayIndex(date: DateStr): number {
  const p = parseDate(date)
  if (!p) return 0
  const utcDay = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
  return (utcDay + 6) % 7
}

/** Weekday abbreviation for a date (independent of the week start setting). */
export function weekdayLabel(date: DateStr): string {
  return WEEKDAY_LABELS[weekdayIndex(date)]
}

/** Index of `date` counting from the configured first day of the week (0..6). */
function weekOffset(date: DateStr, startOnMonday: boolean): number {
  const index = weekdayIndex(date)
  return startOnMonday ? index : (index + 1) % 7
}

/** Weekday labels ordered like the calendar grid columns (start = first day). */
export function calendarWeekdayLabels(startOnMonday = true): string[] {
  if (startOnMonday) return [...WEEKDAY_LABELS]
  return [WEEKDAY_LABELS[6], ...WEEKDAY_LABELS.slice(0, 6)]
}

/** Moves month by delta, handling December -> January and January -> December. */
export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 }
}

/** Calendar-safe day arithmetic (no timezone math). */
export function addDays(date: DateStr, delta: number): DateStr {
  const p = parseDate(date)
  if (!p) return date
  const shifted = new Date(Date.UTC(p.year, p.month - 1, p.day + delta))
  return makeDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate())
}

/** The 7 dates of the week containing `date`, starting on the configured day. */
export function weekOf(date: DateStr, startOnMonday = true): DateStr[] {
  const start = addDays(date, -weekOffset(date, startOnMonday))
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** "21 – 27 de Setembro", or "28 Set – 3 Out" when the week spans months. */
export function formatWeekRange(first: DateStr, last: DateStr): string {
  const a = parseDate(first)
  const b = parseDate(last)
  if (!a || !b) return ''
  const short = (month: number) => MONTH_NAMES[month - 1].slice(0, 3)
  if (a.year === b.year && a.month === b.month) {
    return `${a.day} – ${b.day} de ${MONTH_NAMES[a.month - 1]}`
  }
  if (a.year === b.year) return `${a.day} ${short(a.month)} – ${b.day} ${short(b.month)}`
  return `${a.day}/${a.month}/${a.year} – ${b.day}/${b.month}/${b.year}`
}

/**
 * Blank cells before day 1 in the 6x7 calendar grid (Monday-first columns
 * when `startOnMonday` is true, Sunday otherwise).
 */
export function monthLeadingBlanks(year: number, month: number, startOnMonday = true): number {
  return weekOffset(makeDate(year, month, 1), startOnMonday)
}

/** Calendar grid cells for a month: 6 rows x 7 columns. Cells outside the month are null. */
export function monthGrid(year: number, month: number, startOnMonday = true): (DateStr | null)[] {
  const cells: (DateStr | null)[] = []
  const firstWeekday = monthLeadingBlanks(year, month, startOnMonday)
  const daysInMonth = getDaysInMonth(year, month)
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(makeDate(year, month, day))
  while (cells.length % 7 !== 0 || cells.length < 42) cells.push(null)
  return cells
}

/** Sortable key: YYYYMMDDHHmm (local wall-clock, no timezone math). */
function dateTimeKey(date: DateStr, time: string): number {
  return Number(date.replace(/-/g, '')) * 10000 + Number(time.replace(':', ''))
}

/** True when the occurrence is in the past relative to now (local time). */
export function isPastOccurrence(date: DateStr, time: string, now: Date = new Date()): boolean {
  const key = dateTimeKey(date, time)
  const nowKey =
    Number(todayStr(now).replace(/-/g, '')) * 10000 +
    now.getHours() * 100 +
    now.getMinutes()
  return key <= nowKey
}

/** Chronological comparison with stable tie-break by id (section 29). */
export function compareDateTimeThenId(
  a: { date: string; time: string; id: string },
  b: { date: string; time: string; id: string },
): number {
  const keyDiff = dateTimeKey(a.date, a.time) - dateTimeKey(b.date, b.time)
  if (keyDiff !== 0) return keyDiff
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}
