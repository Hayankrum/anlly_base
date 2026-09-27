import {
  compareDateTimeThenId,
  isPastOccurrence,
  isValidDate,
} from '../utils/dates'
import { isValidTime } from '../utils/time'
import { normalizeColor } from '../utils/colors'
import { newId } from '../utils/id'
import * as storage from './storage/events'
import {
  buildAlarmRequest,
  cancelAlarm,
  cancelEventAlarms,
  scheduleAlarm,
} from './alarm/alarmService'
import type {
  AlarmRequest,
  Event,
  EventInput,
  EventOccurrence,
  EventWithOccurrences,
} from '../types/event'

export function validateEventInput(input: EventInput): string | null {
  if (!input.title.trim()) return 'Informe um título para o evento.'
  if (input.dates.length === 0) return 'Selecione pelo menos uma data.'
  if (input.dates.some((d) => !isValidDate(d))) return 'Data inválida.'
  if (new Set(input.dates).size !== input.dates.length) return 'Há datas duplicadas.'
  if (!isValidTime(input.time)) return 'Informe um horário válido (HH:mm).'
  if (input.alarmEnabled && (input.alarmMinutesBefore < 0 || !Number.isFinite(input.alarmMinutesBefore))) {
    return 'Configuração de alarme inválida.'
  }
  return null
}

function sortedDates(dates: string[]): string[] {
  return [...dates].sort()
}

function buildOccurrences(eventId: string, input: EventInput): EventOccurrence[] {
  return sortedDates(input.dates).map((date) => ({
    id: newId(),
    eventId,
    date,
    time: input.time,
    alarmEnabled: input.alarmEnabled,
    alarmMinutesBefore: input.alarmMinutesBefore,
  }))
}

function shouldSchedule(occ: EventOccurrence): boolean {
  return occ.alarmEnabled && !isPastOccurrence(occ.date, occ.time)
}

export function buildEventAlarmRequests(events: EventWithOccurrences[]): AlarmRequest[] {
  const requests: AlarmRequest[] = []
  for (const event of events) {
    for (const occ of event.occurrences) {
      if (shouldSchedule(occ)) requests.push(buildAlarmRequest(occ, event.title))
    }
  }
  requests.sort((a, b) =>
    compareDateTimeThenId(
      { date: a.date, time: a.time, id: a.occurrenceId },
      { date: b.date, time: b.time, id: b.occurrenceId },
    ),
  )
  return requests
}

export async function loadEvents(): Promise<EventWithOccurrences[]> {
  return storage.fetchEventsWithOccurrences()
}

export async function createEvent(input: EventInput): Promise<EventWithOccurrences> {
  const validationError = validateEventInput(input)
  if (validationError) throw new Error(validationError)

  const now = new Date().toISOString()
  const event: Event = {
    id: newId(),
    title: input.title.trim(),
    description: input.description.trim() || undefined,
    category: input.category.trim() || undefined,
    color: normalizeColor(input.color),
    createdAt: now,
    updatedAt: now,
  }
  const occurrences = buildOccurrences(event.id, input)

  await storage.insertEvent(event)
  for (const occ of occurrences) {
    await storage.insertOccurrence(occ)
    if (shouldSchedule(occ)) {
      await scheduleAlarm(buildAlarmRequest(occ, event.title))
    }
  }

  return { ...event, occurrences }
}

/**
 * Updates title/metadata and reconciles occurrences:
 * - new date -> insert + schedule (when applicable)
 * - removed date -> delete occurrence + cancel its alarm
 * - changed time/alarm -> update row + cancel old alarm + schedule new one
 */
export async function updateEvent(
  eventId: string,
  input: EventInput,
): Promise<EventWithOccurrences> {
  const validationError = validateEventInput(input)
  if (validationError) throw new Error(validationError)

  const previous = await storage.fetchOccurrencesByEvent(eventId)
  const previousByDate = new Map(previous.map((occ) => [occ.date, occ]))
  const selectedDates = sortedDates(input.dates)
  const selectedSet = new Set(selectedDates)
  const now = new Date().toISOString()

  const kept: EventOccurrence[] = []
  for (const date of selectedDates) {
    const existing = previousByDate.get(date)
    if (existing) {
      const updated: EventOccurrence = {
        ...existing,
        time: input.time,
        alarmEnabled: input.alarmEnabled,
        alarmMinutesBefore: input.alarmMinutesBefore,
      }
      const changed =
        updated.time !== existing.time ||
        updated.alarmEnabled !== existing.alarmEnabled ||
        updated.alarmMinutesBefore !== existing.alarmMinutesBefore
      if (changed) {
        await storage.updateOccurrenceRow(updated)
        await cancelAlarm(existing.id)
      }
      kept.push(updated)
    } else {
      const created: EventOccurrence = {
        id: newId(),
        eventId,
        date,
        time: input.time,
        alarmEnabled: input.alarmEnabled,
        alarmMinutesBefore: input.alarmMinutesBefore,
      }
      await storage.insertOccurrence(created)
      kept.push(created)
    }
  }

  const removed = previous.filter((occ) => !selectedSet.has(occ.date))
  if (removed.length > 0) {
    for (const occ of removed) await cancelAlarm(occ.id)
    await storage.deleteOccurrences(removed.map((occ) => occ.id))
  }

  await storage.updateEventRow(eventId, {
    title: input.title.trim(),
    description: input.description.trim() || undefined,
    category: input.category.trim() || undefined,
    color: normalizeColor(input.color),
    updatedAt: now,
  })

  const title = input.title.trim()
  for (const occ of kept) {
    if (shouldSchedule(occ)) await scheduleAlarm(buildAlarmRequest(occ, title))
  }

  const stored = await storage.fetchEventsWithOccurrences()
  const updatedEvent = stored.find((event) => event.id === eventId)
  if (!updatedEvent) throw new Error('Evento não encontrado após a atualização.')
  return updatedEvent
}

export async function deleteEvent(eventId: string): Promise<void> {
  await cancelEventAlarms(eventId)
  await storage.deleteEventRecord(eventId)
}
