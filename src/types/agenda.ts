import type { EventWithOccurrences } from './event'

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
  /** hex color of the event */
  color: string
  alarmEnabled?: boolean
}
