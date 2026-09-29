import type { AgendaDayItem, CalendarSources } from '../../types/agenda'

/** Flattens event occurrences into the rows shown by the agenda. */
export function buildAgendaItems(sources: CalendarSources): AgendaDayItem[] {
  const items: AgendaDayItem[] = []

  for (const event of sources.events) {
    for (const occurrence of event.occurrences) {
      items.push({
        id: occurrence.id,
        refId: occurrence.eventId,
        date: occurrence.date,
        time: occurrence.time,
        title: event.title,
        description: event.description,
        category: event.category,
        icon: event.icon,
        durationMinutes: event.durationMinutes,
        color: event.color,
        done: Boolean(occurrence.doneAt),
        alarmEnabled: occurrence.alarmEnabled,
        kind: event.kind,
        timerStartedAt: occurrence.timerStartedAt,
        timerElapsedMs: occurrence.timerElapsedMs,
      })
    }
  }

  return items
}

/** Chronological, stable by id. */
export function compareAgendaItems(a: AgendaDayItem, b: AgendaDayItem): number {
  if (a.time !== b.time) return a.time < b.time ? -1 : 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}
