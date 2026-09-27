import {
  compareDateTimeThenId,
  isPastOccurrence,
  isValidDate,
} from '../utils/dates'
import { isValidTime } from '../utils/time'
import { normalizeColor } from '../utils/colors'
import { normalizeIcon } from '../utils/icons'
import { newId } from '../utils/id'
import { expandRecurrence, normalizeWeekdays } from '../utils/recurrence'
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
  if (!input.title.trim()) return 'Informe um título para o afazer.'
  if (input.dates.length === 0) return 'Selecione pelo menos uma data.'
  if (input.dates.some((d) => !isValidDate(d))) return 'Data inválida.'
  if (new Set(input.dates).size !== input.dates.length) return 'Há datas duplicadas.'
  if (!isValidTime(input.time)) return 'Informe um horário válido (ex.: 17:00).'
  if (input.recurrence === 'custom' && normalizeWeekdays(input.recurrenceDays).length === 0) {
    return 'Marque pelo menos um dia da semana para repetir.'
  }
  if (input.durationMinutes !== null && input.durationMinutes < 0) {
    return 'Duração inválida.'
  }
  if (input.alarmEnabled && (input.alarmMinutesBefore < 0 || !Number.isFinite(input.alarmMinutesBefore))) {
    return 'Configuração de lembrete inválida.'
  }
  return null
}

function sortedDates(dates: string[]): string[] {
  return [...dates].sort()
}

function buildOccurrences(eventId: string, input: EventInput): EventOccurrence[] {
  return expandRecurrence(sortedDates(input.dates), input.recurrence, input.recurrenceDays).map(
    (date) => ({
      id: newId(),
      eventId,
      date,
      time: input.time,
      alarmEnabled: input.alarmEnabled,
      alarmMinutesBefore: input.alarmMinutesBefore,
      doneAt: null,
    }),
  )
}

/** Completed occurrences never reach the native scheduler. */
function shouldSchedule(occ: EventOccurrence): boolean {
  return occ.alarmEnabled && !occ.doneAt && !isPastOccurrence(occ.date, occ.time)
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
    icon: normalizeIcon(input.icon),
    color: normalizeColor(input.color),
    durationMinutes: input.durationMinutes,
    recurrence: input.recurrence,
    recurrenceDays: normalizeWeekdays(input.recurrenceDays),
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
  const selectedDates = expandRecurrence(
    sortedDates(input.dates),
    input.recurrence,
    input.recurrenceDays,
  )
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
        doneAt: null,
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
    icon: normalizeIcon(input.icon),
    color: normalizeColor(input.color),
    durationMinutes: input.durationMinutes,
    recurrence: input.recurrence,
    recurrenceDays: normalizeWeekdays(input.recurrenceDays),
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

/**
 * Marks one occurrence as done or pending.
 * Completion is only a state change — the single side effect on the alarm
 * layer is dropping (or restoring) the reminder of that one occurrence.
 */
export async function setOccurrenceDone(occurrenceId: string, done: boolean): Promise<void> {
  if (done) {
    await storage.updateOccurrenceDone(occurrenceId, new Date().toISOString())
    await cancelAlarm(occurrenceId)
    return
  }

  await storage.updateOccurrenceDone(occurrenceId, null)
  const events = await storage.fetchEventsWithOccurrences()
  for (const event of events) {
    const occ = event.occurrences.find((candidate) => candidate.id === occurrenceId)
    if (!occ) continue
    if (shouldSchedule(occ)) await scheduleAlarm(buildAlarmRequest(occ, event.title))
    return
  }
}
