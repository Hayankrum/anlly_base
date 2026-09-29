import { getDatabase } from './database'
import { normalizeColor } from '../../utils/colors'
import { normalizeIcon } from '../../utils/icons'
import type { Event, EventKind, EventOccurrence, EventWithOccurrences, RecurrenceRule } from '../../types/event'

interface EventRow {
  id: string
  title: string
  description: string | null
  category: string | null
  icon: string | null
  color: string | null
  duration_minutes: number | null
  recurrence: string | null
  recurrence_days: string | null
  kind: string | null
  created_at: string
  updated_at: string
}

interface OccurrenceRow {
  id: string
  event_id: string
  date: string
  time: string
  alarm_enabled: number | boolean
  alarm_minutes_before: number
  done_at: string | null
  timer_started_at: string | null
  timer_elapsed_ms: number | null
}

const RECURRENCE_VALUES: RecurrenceRule[] = [
  'none',
  'daily',
  'weekdays',
  'weekly',
  'biweekly',
  'monthly',
  'custom',
]

/** "0,3" -> [0, 3]; anything outside 0..6 is dropped. */
function parseRecurrenceDays(value: string | null): number[] {
  if (!value) return []
  const days = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  return [...new Set(days)].sort((a, b) => a - b)
}

function encodeRecurrenceDays(days: number[]): string | null {
  const unique = [...new Set(days)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  if (unique.length === 0) return null
  return unique.sort((a, b) => a - b).join(',')
}

function mapRecurrence(value: string | null): RecurrenceRule {
  return RECURRENCE_VALUES.includes(value as RecurrenceRule)
    ? (value as RecurrenceRule)
    : 'none'
}

function mapKind(value: string | null): EventKind {
  return value === 'timer' ? 'timer' : 'normal'
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    icon: normalizeIcon(row.icon),
    color: normalizeColor(row.color),
    durationMinutes: row.duration_minutes ?? null,
    recurrence: mapRecurrence(row.recurrence),
    recurrenceDays: parseRecurrenceDays(row.recurrence_days),
    kind: mapKind(row.kind),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapOccurrence(row: OccurrenceRow): EventOccurrence {
  return {
    id: row.id,
    eventId: row.event_id,
    date: row.date,
    time: row.time,
    alarmEnabled: Boolean(Number(row.alarm_enabled)),
    alarmMinutesBefore: Number(row.alarm_minutes_before),
    doneAt: row.done_at,
    timerStartedAt: row.timer_started_at,
    timerElapsedMs: Number(row.timer_elapsed_ms ?? 0),
  }
}

const EVENT_COLUMNS =
  'id, title, description, category, icon, color, duration_minutes, recurrence, recurrence_days, kind, created_at, updated_at'
const OCCURRENCE_COLUMNS =
  'id, event_id, date, time, alarm_enabled, alarm_minutes_before, done_at, timer_started_at, timer_elapsed_ms'

export async function fetchEventsWithOccurrences(): Promise<EventWithOccurrences[]> {
  const db = await getDatabase()
  const [eventsRes, occRes] = await Promise.all([
    db.select<EventRow[]>(`SELECT ${EVENT_COLUMNS} FROM events ORDER BY created_at DESC, id ASC`),
    db.select<OccurrenceRow[]>(`SELECT ${OCCURRENCE_COLUMNS} FROM occurrences ORDER BY date ASC, time ASC, id ASC`),
  ])

  const occurrencesByEvent = new Map<string, EventOccurrence[]>()
  for (const row of occRes) {
    const occ = mapOccurrence(row)
    const list = occurrencesByEvent.get(occ.eventId)
    if (list) list.push(occ)
    else occurrencesByEvent.set(occ.eventId, [occ])
  }

  return eventsRes.map((row) => {
    const event = mapEvent(row)
    return { ...event, occurrences: occurrencesByEvent.get(event.id) ?? [] }
  })
}

export async function fetchOccurrencesByEvent(eventId: string): Promise<EventOccurrence[]> {
  const db = await getDatabase()
  const rows = await db.select<OccurrenceRow[]>(
    `SELECT ${OCCURRENCE_COLUMNS} FROM occurrences
      WHERE event_id = $1
      ORDER BY date ASC, time ASC, id ASC`,
    [eventId],
  )
  return rows.map(mapOccurrence)
}

export async function insertEvent(event: Event): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO events (${EVENT_COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      event.id,
      event.title,
      event.description ?? null,
      event.category ?? null,
      event.icon,
      event.color,
      event.durationMinutes,
      event.recurrence,
      encodeRecurrenceDays(event.recurrenceDays),
      event.kind,
      event.createdAt,
      event.updatedAt,
    ],
  )
}

export interface EventFields {
  title: string
  description?: string
  category?: string
  icon: string
  color: string
  durationMinutes: number | null
  recurrence: RecurrenceRule
  recurrenceDays: number[]
  kind: EventKind
  updatedAt: string
}

export async function updateEventRow(id: string, fields: EventFields): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `UPDATE events SET title = $1, description = $2, category = $3, icon = $4, color = $5,
       duration_minutes = $6, recurrence = $7, recurrence_days = $8, kind = $9, updated_at = $10 WHERE id = $11`,
    [
      fields.title,
      fields.description ?? null,
      fields.category ?? null,
      fields.icon,
      fields.color,
      fields.durationMinutes,
      fields.recurrence,
      encodeRecurrenceDays(fields.recurrenceDays),
      fields.kind,
      fields.updatedAt,
      id,
    ],
  )
}

export async function insertOccurrence(occ: EventOccurrence): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO occurrences (${OCCURRENCE_COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      occ.id,
      occ.eventId,
      occ.date,
      occ.time,
      occ.alarmEnabled ? 1 : 0,
      occ.alarmMinutesBefore,
      occ.doneAt,
      occ.timerStartedAt,
      occ.timerElapsedMs,
    ],
  )
}

/** Marks one occurrence as done (ISO timestamp) or pending (null). */
export async function updateOccurrenceDone(id: string, doneAt: string | null): Promise<void> {
  const db = await getDatabase()
  await db.execute(`UPDATE occurrences SET done_at = $1 WHERE id = $2`, [doneAt, id])
}

/** Saves the stopwatch state of one occurrence (running since / paused total). */
export async function updateOccurrenceTimer(
  id: string,
  timerStartedAt: string | null,
  timerElapsedMs: number,
): Promise<void> {
  const db = await getDatabase()
  await db.execute(`UPDATE occurrences SET timer_started_at = $1, timer_elapsed_ms = $2 WHERE id = $3`, [
    timerStartedAt,
    timerElapsedMs,
    id,
  ])
}

export async function updateOccurrenceRow(occ: EventOccurrence): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `UPDATE occurrences SET date = $1, time = $2, alarm_enabled = $3, alarm_minutes_before = $4 WHERE id = $5`,
    [
      occ.date,
      occ.time,
      occ.alarmEnabled ? 1 : 0,
      occ.alarmMinutesBefore,
      occ.id,
    ],
  )
}

export async function deleteOccurrences(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = await getDatabase()
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
  await db.execute(`DELETE FROM occurrences WHERE id IN (${placeholders})`, ids)
}

/** Deletes the event and all of its occurrences explicitly. */
export async function deleteEventRecord(eventId: string): Promise<void> {
  const db = await getDatabase()
  await db.execute(`DELETE FROM occurrences WHERE event_id = $1`, [eventId])
  await db.execute(`DELETE FROM events WHERE id = $1`, [eventId])
}
