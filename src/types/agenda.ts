import type { EventKind, EventWithOccurrences } from './event'

/** Everything the agenda renders, supplied by the page that owns the hooks. */
export interface CalendarSources {
  events: EventWithOccurrences[]
}

/** One row of the agenda day list: one event occurrence. */
export interface AgendaDayItem {
  /** unique within the day list (occurrence id) */
  id: string
  /** id of the event behind the row */
  refId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm */
  time: string
  title: string
  description?: string
  category?: string
  /** emoji of the event */
  icon: string
  /** planned length in minutes, null = not set */
  durationMinutes: number | null
  /** hex color of the event */
  color: string
  /** true when the occurrence was completed */
  done: boolean
  alarmEnabled?: boolean
  /** 'timer' rows carry the stopwatch state instead of relying on the slot */
  kind: EventKind
  timerStartedAt: string | null
  timerElapsedMs: number
}
