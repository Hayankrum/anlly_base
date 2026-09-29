/**
 * 'normal' happens at the scheduled time; 'timer' is measured by a stopwatch
 * the user starts/pauses (the real time matters more than the slot).
 */
export type EventKind = 'normal' | 'timer'

export type RecurrenceRule =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  /** arbitrary weekdays chosen in the form calendar (see recurrenceDays) */
  | 'custom'

export interface Event {
  id: string
  title: string
  description?: string
  category?: string
  /** emoji shown on the trail, details and lists */
  icon: string
  /** hex color used in lists and the calendar (see utils/colors.ts) */
  color: string
  /** planned length in minutes, null = not set */
  durationMinutes: number | null
  /** how the selected dates repeat */
  recurrence: RecurrenceRule
  /** 0 = Monday … 6 = Sunday, only used when recurrence is 'custom' */
  recurrenceDays: number[]
  /** 'timer' afazeres carry a stopwatch instead of relying on the slot */
  kind: EventKind
  createdAt: string
  updatedAt: string
}

export interface EventOccurrence {
  id: string
  eventId: string
  /** YYYY-MM-DD (local calendar date, no timezone) */
  date: string
  /** HH:mm */
  time: string
  alarmEnabled: boolean
  alarmMinutesBefore: number
  /** ISO timestamp of when the user completed it, null = pending */
  doneAt: string | null
  /** ISO timestamp of the current stopwatch run, null = not running */
  timerStartedAt: string | null
  /** stopwatch time accumulated while paused (ms) */
  timerElapsedMs: number
}

export interface EventWithOccurrences extends Event {
  occurrences: EventOccurrence[]
}

/** Payload sent to the native alarm scheduler (one per occurrence). */
export interface AlarmRequest {
  occurrenceId: string
  eventId: string
  title: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm */
  time: string
  /** minutes before the occurrence */
  minutesBefore: number
}

export interface AlarmStatus {
  isAndroid: boolean
  notificationsGranted: boolean
  canScheduleExactAlarms: boolean
  canUseFullScreenIntent: boolean
  exactAlarmFallback: boolean
}

/** Form payload used by create/edit screens. */
export interface EventInput {
  title: string
  description: string
  category: string
  icon: string
  /** hex color */
  color: string
  durationMinutes: number | null
  recurrence: RecurrenceRule
  /** weekdays for the 'custom' rule, 0 = Monday … 6 = Sunday */
  recurrenceDays: number[]
  /** selected dates YYYY-MM-DD (the first one anchors a recurrence rule) */
  dates: string[]
  /** HH:mm applied to every selected date */
  time: string
  alarmEnabled: boolean
  alarmMinutesBefore: number
  /** 'timer' afazeres get stopwatch controls instead of a fixed slot */
  kind: EventKind
}
