import type { CSSProperties } from 'react'
import { useSettings } from '../../../hooks/useSettings'
import { formatTimeDisplay } from '../../../utils/time'
import type { AgendaDayItem } from '../../../types/agenda'

interface AgendaItemCardProps {
  item: AgendaDayItem
  onOpen: (eventId: string) => void
}

export function AgendaItemCard({ item, onOpen }: AgendaItemCardProps) {
  const { settings } = useSettings()

  return (
    <button
      type="button"
      className="agenda-card"
      onClick={() => onOpen(item.refId)}
      style={{ '--agenda-color': item.color } as CSSProperties}
    >
      <span className="agenda-time">
        {formatTimeDisplay(item.time, settings.timeFormat12h)}
      </span>
      <span className="agenda-info">
        <span className="agenda-title">{item.title}</span>
        {item.category ? <span className="agenda-subtitle">{item.category}</span> : null}
      </span>
      {item.alarmEnabled ? (
        <span className="agenda-icon" title="alarme ativo" aria-label="alarme ativo">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
            />
          </svg>
        </span>
      ) : null}
    </button>
  )
}
