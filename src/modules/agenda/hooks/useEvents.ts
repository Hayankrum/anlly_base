import { useCallback, useEffect, useState } from 'react'
import {
  createEvent,
  deleteEvent,
  loadEvents,
  updateEvent,
} from '../../../services/eventService'
import type { EventInput, EventWithOccurrences } from '../../../types/event'

interface UseEventsResult {
  events: EventWithOccurrences[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  saveEvent: (input: EventInput, eventId?: string) => Promise<EventWithOccurrences>
  removeEvent: (eventId: string) => Promise<void>
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Erro inesperado.'
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<EventWithOccurrences[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setEvents(await loadEvents())
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void refresh())
  }, [refresh])

  const saveEvent = useCallback(
    async (input: EventInput, eventId?: string): Promise<EventWithOccurrences> => {
      try {
        setError(null)
        const saved = eventId ? await updateEvent(eventId, input) : await createEvent(input)
        await refresh()
        return saved
      } catch (err) {
        const msg = messageOf(err)
        setError(msg)
        throw new Error(msg, { cause: err })
      }
    },
    [refresh],
  )

  const removeEvent = useCallback(
    async (eventId: string): Promise<void> => {
      try {
        setError(null)
        await deleteEvent(eventId)
        await refresh()
      } catch (err) {
        const msg = messageOf(err)
        setError(msg)
        throw new Error(msg, { cause: err })
      }
    },
    [refresh],
  )

  return { events, loading, error, refresh, saveEvent, removeEvent }
}
