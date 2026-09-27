import { getDatabase } from './database'
import { normalizeColor } from '../../utils/colors'
import type { Event, EventOccurrence, EventWithOccurrences } from '../../types/event'

interface EventRow {
  id: string
  title: string
  description: string | null
  category: string | null
  color: string | null
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
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    color: normalizeColor(row.color),
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
  }
}

const EVENT_COLUMNS = 'id, title, description, category, color, created_at, updated_at'
const OCCURRENCE_COLUMNS = 'id, event_id, date, time, alarm_enabled, alarm_minutes_before'

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
    `INSERT INTO events (${EVENT_COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      event.id,
      event.title,
      event.description ?? null,
      event.category ?? null,
      event.color,
      event.createdAt,
      event.updatedAt,
    ],
  )
}

export async function updateEventRow(
  id: string,
  fields: { title: string; description?: string; category?: string; color: string; updatedAt: string },
): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `UPDATE events SET title = $1, description = $2, category = $3, color = $4, updated_at = $5 WHERE id = $6`,
    [fields.title, fields.description ?? null, fields.category ?? null, fields.color, fields.updatedAt, id],
  )
}

export async function insertOccurrence(occ: EventOccurrence): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO occurrences (${OCCURRENCE_COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      occ.id,
      occ.eventId,
      occ.date,
      occ.time,
      occ.alarmEnabled ? 1 : 0,
      occ.alarmMinutesBefore,
    ],
  )
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
