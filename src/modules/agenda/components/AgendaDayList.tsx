import { AgendaItemCard } from './AgendaItemCard'
import { formatDateLong } from '../../../utils/dates'
import type { AgendaDayItem } from '../../../types/agenda'

interface AgendaDayListProps {
  date: string
  items: AgendaDayItem[]
  /** hides the date heading when the parent already shows it (day view) */
  hideHeading?: boolean
  onOpenItem: (eventId: string) => void
}

export function AgendaDayList({ date, items, hideHeading = false, onOpenItem }: AgendaDayListProps) {
  return (
    <section className="agenda-day-list" aria-label={`agenda de ${formatDateLong(date)}`}>
      {!hideHeading && <h2 className="day-heading">{formatDateLong(date)}</h2>}
      {items.length === 0 ? (
        <p className="day-empty">Nada agendado para este dia.</p>
      ) : (
        <ul className="agenda-rows">
          {items.map((item) => (
            <li key={item.id}>
              <AgendaItemCard item={item} onOpen={onOpenItem} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
