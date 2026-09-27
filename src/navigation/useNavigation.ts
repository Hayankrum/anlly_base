import { createContext, useContext } from 'react'
import type { AreaId } from './areas'

/** Where a navigation action lands, plus optional deep-link parameters. */
export interface NavTarget {
  area: AreaId
  /** YYYY-MM-DD the agenda should open on */
  date?: string
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
  active: 'agenda',
  stack: [{ area: 'agenda' }],
  current: { area: 'agenda' },
  canGoBack: false,
  selectArea: () => {},
  push: () => {},
  back: () => {},
})

export function useNavigation(): NavigationContextValue {
  return useContext(NavigationContext)
}
