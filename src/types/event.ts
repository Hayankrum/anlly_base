export interface Event {
  id: string
  title: string
  description?: string
  category?: string
  /** hex color used in lists and the calendar (see utils/colors.ts) */
  color: string
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
  /** hex color */
  color: string
  /** selected dates YYYY-MM-DD */
  dates: string[]
  /** HH:mm applied to every selected date */
  time: string
  alarmEnabled: boolean
  alarmMinutesBefore: number
}
