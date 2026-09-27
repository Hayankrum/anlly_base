import { formatDateLong, type DateStr } from '../../../utils/dates'

interface DayNavigatorProps {
  date: DateStr
  onPrevDay: () => void
  onNextDay: () => void
  onOpenYear: () => void
}

/** Day view header: ‹ 21 de Setembro › (tap the title to jump to the year map). */
export function DayNavigator({ date, onPrevDay, onNextDay, onOpenYear }: DayNavigatorProps) {
  return (
    <section className="month-calendar" aria-label="dia">
      <header className="calendar-header">
        <button type="button" className="nav-button" onClick={onPrevDay} aria-label="dia anterior">
          ‹
        </button>
        <button
          type="button"
          className="calendar-title"
          onClick={onOpenYear}
          aria-label="ver mapa do ano"
        >
          {formatDateLong(date)}
        </button>
        <button type="button" className="nav-button" onClick={onNextDay} aria-label="próximo dia">
          ›
        </button>
      </header>
    </section>
  )
}
