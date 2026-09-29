import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EventPage } from '../modules/agenda/components/EventPage'
import {
  createEvent,
  deleteEvent,
  loadEvents,
  setOccurrenceDone,
  setOccurrenceTimer,
  updateEvent,
} from '../services/eventService'
import { elapsedMsOf } from '../utils/timer'
import type { EventInput, EventWithOccurrences } from '../types/event'
import { JourneyContext, type JourneyContextValue } from './useJourney'

type FormTarget = { mode: 'create' } | { mode: 'edit'; eventId: string } | null

function messageOf(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string')
    return err.message
  return 'Erro inesperado.'
}

/**
 * Owns the afazer list for the whole app (Home, Painel and Detalhes all read
 * the same state) plus the create/edit sheet, so saving on one screen is
 * instantly visible on the others.
 */
export function JourneyProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventWithOccurrences[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [formTarget, setFormTarget] = useState<FormTarget>(null)

  const eventsRef = useRef<EventWithOccurrences[]>([])
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }, [])

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
    async (input: EventInput, eventId?: string) => {
      try {
        setError(null)
        if (eventId) await updateEvent(eventId, input)
        else await createEvent(input)
        await refresh()
        notify(eventId ? 'Afazer atualizado' : 'Afazer criado')
      } catch (err) {
        const msg = messageOf(err)
        setError(msg)
        throw new Error(msg, { cause: err })
      }
    },
    [refresh, notify],
  )

  const removeEvent = useCallback(
    async (eventId: string) => {
      try {
        setError(null)
        await deleteEvent(eventId)
        await refresh()
        notify('Afazer excluído')
      } catch (err) {
        const msg = messageOf(err)
        setError(msg)
        throw new Error(msg, { cause: err })
      }
    },
    [refresh, notify],
  )

  const completeOccurrence = useCallback(
    async (occurrenceId: string, done = true) => {
      const previous = eventsRef.current
      const stamp = done ? new Date().toISOString() : null
      setEvents((current) =>
        current.map((event) => ({
          ...event,
          occurrences: event.occurrences.map((occ) =>
            occ.id === occurrenceId
              ? {
                  ...occ,
                  doneAt: stamp,
                  // Finishing banks the run in progress (undo keeps it paused).
                  ...(done
                    ? { timerStartedAt: null, timerElapsedMs: elapsedMsOf(occ) }
                    : null),
                }
              : occ,
          ),
        })),
      )
      try {
        setError(null)
        await setOccurrenceDone(occurrenceId, done)
        notify(done ? '✓ Afazer concluído' : 'Afazer reaberto')
      } catch (err) {
        setEvents(previous)
        const msg = messageOf(err)
        setError(msg)
        notify(msg)
      }
    },
    [notify],
  )

  /** Writes a new stopwatch state for one occurrence, optimistically. */
  const patchTimer = useCallback(
    async (occurrenceId: string, next: { timerStartedAt: string | null; timerElapsedMs: number }) => {
      const previous = eventsRef.current
      setEvents((current) =>
        current.map((event) => ({
          ...event,
          occurrences: event.occurrences.map((occ) =>
            occ.id === occurrenceId ? { ...occ, ...next } : occ,
          ),
        })),
      )
      try {
        setError(null)
        await setOccurrenceTimer(occurrenceId, next.timerStartedAt, next.timerElapsedMs)
      } catch (err) {
        setEvents(previous)
        const msg = messageOf(err)
        setError(msg)
        notify(msg)
      }
    },
    [notify],
  )

  const toggleTimer = useCallback(
    async (occurrenceId: string) => {
      const occ = eventsRef.current
        .flatMap((event) => event.occurrences)
        .find((candidate) => candidate.id === occurrenceId)
      if (!occ) return
      if (occ.timerStartedAt) {
        await patchTimer(occurrenceId, {
          timerStartedAt: null,
          timerElapsedMs: elapsedMsOf(occ),
        })
        notify('Cronômetro pausado')
        return
      }
      await patchTimer(occurrenceId, {
        timerStartedAt: new Date().toISOString(),
        timerElapsedMs: occ.timerElapsedMs,
      })
      notify('✓ Cronômetro iniciado')
    },
    [patchTimer, notify],
  )

  const resetTimer = useCallback(
    async (occurrenceId: string) => {
      await patchTimer(occurrenceId, { timerStartedAt: null, timerElapsedMs: 0 })
      notify('Cronômetro zerado')
    },
    [patchTimer, notify],
  )

  const openCreate = useCallback(() => setFormTarget({ mode: 'create' }), [])
  const openEdit = useCallback((eventId: string) => setFormTarget({ mode: 'edit', eventId }), [])
  const closeForm = useCallback(() => setFormTarget(null), [])

  const editingEvent = useMemo(
    () =>
      formTarget?.mode === 'edit'
        ? events.find((event) => event.id === formTarget.eventId)
        : undefined,
    [events, formTarget],
  )

  const showForm = formTarget !== null && (formTarget.mode === 'create' || Boolean(editingEvent))

  /**
   * While the create/edit sheet is open, system back closes it first: an extra
   * history entry holds that state, so one back = one step (sheet, then page).
   */
  const overlayInHistoryRef = useRef(false)

  useEffect(() => {
    if (showForm && !overlayInHistoryRef.current) {
      overlayInHistoryRef.current = true
      window.history.pushState({ anllyOverlay: true }, '')
    } else if (!showForm && overlayInHistoryRef.current) {
      overlayInHistoryRef.current = false
      const top = window.history.state as { anllyOverlay?: boolean } | null
      if (top?.anllyOverlay) window.history.back()
    }
  }, [showForm])

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const top = event.state as { anllyOverlay?: boolean } | null
      if (overlayInHistoryRef.current && !top?.anllyOverlay) {
        overlayInHistoryRef.current = false
        setFormTarget(null)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const value = useMemo<JourneyContextValue>(
    () => ({
      events,
      loading,
      error,
      toast,
      formOpen: formTarget !== null,
      refresh,
      saveEvent,
      removeEvent,
      completeOccurrence,
      toggleTimer,
      resetTimer,
      openCreate,
      openEdit,
      closeForm,
    }),
    [
      events,
      loading,
      error,
      toast,
      formTarget,
      refresh,
      saveEvent,
      removeEvent,
      completeOccurrence,
      toggleTimer,
      resetTimer,
      openCreate,
      openEdit,
      closeForm,
    ],
  )

  return (
    <JourneyContext.Provider value={value}>
      {children}
      {showForm && (
        <EventPage
          key={formTarget.mode === 'edit' ? formTarget.eventId : 'create'}
          event={editingEvent}
          onClose={closeForm}
          onSave={saveEvent}
          onDelete={removeEvent}
        />
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </JourneyContext.Provider>
  )
}
