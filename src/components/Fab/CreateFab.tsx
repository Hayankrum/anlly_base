import { useJourney } from '../../hooks/useJourney'
import { useNavigation } from '../../navigation/useNavigation'

/** Areas that offer creating an afazer from a floating button. */
const FAB_AREAS = new Set(['dashboard', 'calendario'])

/** Floating "+" that opens the create sheet (replaces the old nav entry). */
export function CreateFab() {
  const { active } = useNavigation()
  const { openCreate, formOpen } = useJourney()

  if (!FAB_AREAS.has(active) || formOpen) return null

  return (
    <button type="button" className="fab" onClick={openCreate} aria-label="criar afazer">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          d="M12 5v14M5 12h14"
        />
      </svg>
    </button>
  )
}
