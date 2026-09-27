import { addDays, addMonths, isValidDate, makeDate, parseDate, todayStr } from './dates'
import type { RecurrenceRule } from '../types/event'

/** How far ahead a recurrence rule materialises into occurrences. */
const HORIZON_DAYS = 365
/** Extra coverage so a rule edited much later still has future dates. */
const FUTURE_DAYS = 180
/** Hard cap so a daily rule can never flood the table (~4 years of history). */
const MAX_OCCURRENCES = 1500

export const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  none: 'Sem repetição',
  daily: 'Todo dia',
  weekdays: 'Dias úteis',
  weekly: 'Toda semana',
  biweekly: 'A cada 2 semanas',
  monthly: 'Todo mês',
  custom: 'Dias escolhidos',
}

export const RECURRENCE_OPTIONS: { value: RecurrenceRule; label: string }[] = [
  { value: 'none', label: RECURRENCE_LABELS.none },
  { value: 'daily', label: RECURRENCE_LABELS.daily },
  { value: 'weekdays', label: RECURRENCE_LABELS.weekdays },
  { value: 'weekly', label: RECURRENCE_LABELS.weekly },
  { value: 'biweekly', label: RECURRENCE_LABELS.biweekly },
  { value: 'monthly', label: RECURRENCE_LABELS.monthly },
  { value: 'custom', label: RECURRENCE_LABELS.custom },
]

/** 0 = Monday … 6 = Sunday, the same index used by weekdayIndex(). */
export const WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const
export const WEEKDAY_LONG = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
] as const

/** Drops duplicates and out-of-range values, keeping Monday-first order. */
export function normalizeWeekdays(days: readonly number[]): number[] {
  const unique = days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  return [...new Set(unique)].sort((a, b) => a - b)
}

/** "Toda terça", "Todo sábado", "Segunda, terça e quinta". */
export function describeWeekdays(days: readonly number[]): string {
  const sorted = normalizeWeekdays(days)
  if (sorted.length === 0) return RECURRENCE_LABELS.custom
  if (sorted.length === 7) return 'Todos os dias'
  const names = sorted.map((day) => WEEKDAY_LONG[day])
  if (sorted.length === 1) {
    const article = sorted[0] >= 5 ? 'o' : 'a'
    return `Tod${article} ${names[0].toLowerCase()}`
  }
  return names
    .map((name, index) => (index === 0 ? name : name.toLowerCase()))
    .join(', ')
    .replace(/, ([^,]+)$/, ' e $1')
}

/** Friendly label for the detail page and lists. */
export function recurrenceLabel(rule: RecurrenceRule, days: readonly number[] = []): string {
  return rule === 'custom' ? describeWeekdays(days) : RECURRENCE_LABELS[rule]
}

export function weekdayIndex(date: string): number {
  const p = parseDate(date)
  if (!p) return 0
  const day = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
  return (day + 6) % 7 // 0 = Monday
}

/** First day of the week rules that skip Saturday and Sunday. */
function isWeekday(date: string): boolean {
  return weekdayIndex(date) < 5
}

/** Next date of a rule, or null when the rule cannot advance. */
function nextDate(date: string, rule: RecurrenceRule, anchorDay: number): string | null {
  switch (rule) {
    case 'daily':
      return addDays(date, 1)
    case 'weekdays': {
      let next = addDays(date, 1)
      for (let i = 0; i < 7 && !isWeekday(next); i++) next = addDays(next, 1)
      return isWeekday(next) ? next : null
    }
    case 'weekly':
      return addDays(date, 7)
    case 'biweekly':
      return addDays(date, 14)
    case 'monthly': {
      const parts = parseDate(date)
      if (!parts) return null
      const shifted = addMonths(parts.year, parts.month, 1)
      const daysInMonth = new Date(Date.UTC(shifted.year, shifted.month, 0)).getUTCDate()
      // Keeps day 31 -> 28/29 in short months instead of drifting to 28 forever.
      return makeDate(shifted.year, shifted.month, Math.min(anchorDay, daysInMonth))
    }
    default:
      return null
  }
}

/**
 * Turns the dates picked in the form into the concrete occurrence dates.
 * `none` keeps the manual selection; every other rule expands from the
 * earliest selected date up to the horizon.
 *
 * The anchor itself is only kept when it obeys the rule, so a "dias úteis"
 * rule anchored on a Sunday starts on Monday instead of emitting a weekend date.
 */
export function expandRecurrence(
  dates: string[],
  rule: RecurrenceRule,
  recurrenceDays: readonly number[] = [],
): string[] {
  const valid = [...new Set(dates.filter(isValidDate))].sort()
  if (valid.length === 0) return []
  if (rule === 'none') return valid

  const anchor = valid[0]
  const anchorDay = parseDate(anchor)?.day ?? 1
  const horizon = [addDays(anchor, HORIZON_DAYS), addDays(todayStr(), FUTURE_DAYS)]
    .sort()
    .at(-1) as string

  if (rule === 'custom') {
    const days = normalizeWeekdays(recurrenceDays)
    if (days.length === 0) return valid
    const wanted = new Set(days)
    const result: string[] = []
    if (wanted.has(weekdayIndex(anchor))) result.push(anchor)
    let cursor = anchor
    // Day-by-day scan; the horizon is at most a couple of years away.
    for (let i = 0; i < MAX_OCCURRENCES + 500; i++) {
      cursor = addDays(cursor, 1)
      if (cursor > horizon) break
      if (wanted.has(weekdayIndex(cursor))) result.push(cursor)
      if (result.length > MAX_OCCURRENCES) result.shift()
    }
    return result.length > 0 ? result : [anchor]
  }

  const anchorValid = rule !== 'weekdays' || isWeekday(anchor)
  const result: string[] = anchorValid ? [anchor] : []
  let cursor = anchor
  while (true) {
    const next = nextDate(cursor, rule, anchorDay)
    if (!next || next > horizon) break
    result.push(next)
    // Old anchors must still reach today: keep only the most recent window.
    if (result.length > MAX_OCCURRENCES) result.shift()
    cursor = next
  }
  return result.length > 0 ? result : [anchor]
}
