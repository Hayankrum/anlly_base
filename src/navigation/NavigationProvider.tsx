import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { NavigationContext, type NavTarget } from './useNavigation'

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<NavTarget[]>([{ area: 'agenda' }])

  const selectArea = useCallback((target: NavTarget) => {
    setStack((current) =>
      current.length === 1 && sameTarget(current[0], target) ? current : [target],
    )
  }, [])

  const push = useCallback((target: NavTarget) => {
    setStack((current) =>
      sameTarget(current[current.length - 1], target) ? current : [...current, target],
    )
  }, [])

  const back = useCallback(() => {
    setStack((current) => (current.length > 1 ? current.slice(0, -1) : current))
  }, [])

  const value = useMemo(() => {
    const current = stack[stack.length - 1]
    return {
      active: current.area,
      stack,
      current,
      canGoBack: stack.length > 1,
      selectArea,
      push,
      back,
    }
  }, [stack, selectArea, push, back])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

function sameTarget(a: NavTarget, b: NavTarget): boolean {
  return a.area === b.area && a.date === b.date
}
