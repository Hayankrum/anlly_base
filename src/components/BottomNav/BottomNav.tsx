import { NAV_ENTRIES } from '../../navigation/areas'
import { useNavigation } from '../../navigation/useNavigation'

/**
 * Floating horizontal navigation bar, fixed at the bottom center of the
 * viewport. It stays expanded (labels always visible) and closes nothing.
 * Creating an afazer lives in the floating "+" button instead of this bar.
 */
export function BottomNav() {
  const { active, selectArea } = useNavigation()

  return (
    <nav className="bottom-nav" aria-label="navegação principal">
      <ul className="bottom-nav-list">
        {NAV_ENTRIES.map((entry) => {
          const isActive = active === entry.id
          return (
            <li key={entry.id}>
              <button
                type="button"
                className={`bottom-nav-item${isActive ? ' is-active' : ''}`}
                onClick={() => selectArea({ area: entry.id })}
                aria-current={isActive ? 'page' : undefined}
              >
                {entry.icon}
                <span>{entry.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
