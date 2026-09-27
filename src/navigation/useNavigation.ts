import { createContext, useContext } from 'react'
import type { AreaId } from './areas'

/** Where a navigation action lands, plus optional deep-link parameters. */
export interface NavTarget {
  area: AreaId
  /** YYYY-MM-DD the agenda/dashboard should open on */
  date?: string
  /** afazer whose details page should open */
  eventId?: string
  /** specific occurrence (day) shown on the details page */
  occurrenceId?: string
}

export interface NavigationContextValue {
  /** Area currently on screen (top of the stack). */
  active: AreaId
  /** Areas (with their parameters) from bottom to top. */
  stack: NavTarget[]
  /** Parameters of the area currently on screen. */
  current: NavTarget
  canGoBack: boolean
  /** Tab press: replaces the stack with a single area. */
  selectArea: (target: NavTarget) => void
  /** In-app navigation: pushes onto the stack. */
  push: (target: NavTarget) => void
  /** Pops one level, returning false when there is nothing to pop. */
  back: () => void
}

export const NavigationContext = createContext<NavigationContextValue>({
  active: 'home',
  stack: [{ area: 'home' }],
  current: { area: 'home' },
  canGoBack: false,
  selectArea: () => {},
  push: () => {},
  back: () => {},
})

export function useNavigation(): NavigationContextValue {
  return useContext(NavigationContext)
}
