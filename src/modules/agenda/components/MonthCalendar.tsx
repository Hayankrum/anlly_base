import { DayCell } from './DayCell'
import { monthGrid, parseDate, type DateStr } from '../../../utils/dates'

interface MonthCalendarProps {
  year: number
  month: number
  label: string
  selectedDate: DateStr
  today: DateStr
  /** first event color per date */
  dayColors: Map<string, string>
  /** true = columns start on Monday */
  startOnMonday: boolean
  /** weekday labels in grid column order */
  weekdayLabels: string[]
  onSelectDate: (date: DateStr) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onOpenYear: () => void
}

export function MonthCalendar({
  year,
  month,
  label,
  selectedDate,
  today,
  dayColors,
  startOnMonday,
  weekdayLabels,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onOpenYear,
}: MonthCalendarProps) {
  const cells = monthGrid(year, month, startOnMonday)

  return (
    <section className="month-calendar" aria-label="calendário">
      <header className="calendar-header">
        <button type="button" className="nav-button" onClick={onPrevMonth} aria-label="mês anterior">
          ‹
        </button>
        <button
          type="button"
          className="calendar-title"
          onClick={onOpenYear}
          aria-label="ver mapa do ano"
        >
          {label}
        </button>
        <button type="button" className="nav-button" onClick={onNextMonth} aria-label="próximo mês">
          ›
        </button>
      </header>

      <div className="weekday-row" aria-hidden="true">
        {weekdayLabels.map((label_) => (
          <span key={label_} className="weekday-label">
            {label_}
          </span>
        ))}
      </div>

      <div className="days-grid">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className="day-cell is-empty" />
          const parts = parseDate(date)
          return (
            <DayCell
              key={date}
              date={date}
              dayNumber={parts?.day ?? Number(date.slice(-2))}
              isToday={date === today}
              isSelected={date === selectedDate}
              hasItems={dayColors.has(date)}
              dotColor={dayColors.get(date)}
              onSelect={onSelectDate}
            />
          )
        })}
      </div>
    </section>
  )
}
