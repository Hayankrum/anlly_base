import { DayCell } from './DayCell'
import { parseDate, type DateStr } from '../../../utils/dates'

interface WeekViewProps {
  /** "21 – 27 de Setembro" */
  label: string
  /** Monday..Sunday (or Sunday..Saturday) */
  weekDays: DateStr[]
  /** weekday labels in grid column order */
  weekdayLabels: string[]
  selectedDate: DateStr
  today: DateStr
  dayColors: Map<string, string>
  onSelectDate: (date: DateStr) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onOpenYear: () => void
}

export function WeekView({
  label,
  weekDays,
  weekdayLabels,
  selectedDate,
  today,
  dayColors,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onOpenYear,
}: WeekViewProps) {
  return (
    <section className="month-calendar" aria-label="semana">
      <header className="calendar-header">
        <button type="button" className="nav-button" onClick={onPrevWeek} aria-label="semana anterior">
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
        <button type="button" className="nav-button" onClick={onNextWeek} aria-label="próxima semana">
          ›
        </button>
      </header>

      <div className="weekday-row" aria-hidden="true">
        {weekdayLabels.map((weekday) => (
          <span key={weekday} className="weekday-label">
            {weekday}
          </span>
        ))}
      </div>

      <div className="days-grid week-grid">
        {weekDays.map((date) => {
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
