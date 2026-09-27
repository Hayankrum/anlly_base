import { createContext, useContext } from 'react'
import type { EventInput, EventWithOccurrences } from '../types/event'

export interface JourneyContextValue {
  /** Every afazer with its occurrences (single source of truth for all pages). */
  events: EventWithOccurrences[]
  loading: boolean
  error: string | null
  /** Short-lived confirmation message shown as a toast. */
  toast: string | null
  /** True while the create/edit sheet is on screen. */
  formOpen: boolean
  refresh: () => Promise<void>
  saveEvent: (input: EventInput, eventId?: string) => Promise<void>
  removeEvent: (eventId: string) => Promise<void>
  /** Marks one occurrence of an afazer as done (or pending again). */
  completeOccurrence: (occurrenceId: string, done?: boolean) => Promise<void>
  openCreate: () => void
  openEdit: (eventId: string) => void
  closeForm: () => void
}

export const JourneyContext = createContext<JourneyContextValue>({
  events: [],
  loading: true,
  error: null,
  toast: null,
  formOpen: false,
  refresh: async () => {},
  saveEvent: async () => {},
  removeEvent: async () => {},
  completeOccurrence: async () => {},
  openCreate: () => {},
  openEdit: () => {},
  closeForm: () => {},
})

export function useJourney(): JourneyContextValue {
  return useContext(JourneyContext)
}
