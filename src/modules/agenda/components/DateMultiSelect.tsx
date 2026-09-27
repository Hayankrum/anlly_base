import { useState } from 'react'
import { DayCell } from './DayCell'
import { useSettings } from '../../../hooks/useSettings'
import {
  calendarWeekdayLabels,
  addMonths,
  monthLabel,
  monthGrid,
  parseDate,
  todayStr,
} from '../../../utils/dates'
import type { DateStr } from '../../../utils/dates'

interface DateMultiSelectProps {
  value: DateStr[]
  onChange: (dates: DateStr[]) => void
}

/**
 * Independent calendar for picking many individual dates (sections 7 and 8).
 * Dates never become an interval and can span multiple months.
 */
export function DateMultiSelect({ value, onChange }: DateMultiSelectProps) {
  const { settings } = useSettings()
  const startOnMonday = settings.weekStartsOn === 'mon'
  const today = todayStr()
  const initial = parseDate(value[0] ?? today) ?? parseDate(today)!
  const [view, setView] = useState(() => ({ year: initial.year, month: initial.month }))
  const selected = new Set(value)

  const toggle = (date: DateStr) => {
    if (selected.has(date)) {
      onChange(value.filter((d) => d !== date))
    } else {
      onChange([...value, date].sort())
    }
  }

  const cells = monthGrid(view.year, view.month, startOnMonday)
  const weekdayLabels = calendarWeekdayLabels(startOnMonday)

  return (
    <div className="date-multi-select">
      <header className="calendar-header">
        <button
          type="button"
          className="nav-button"
          onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
          aria-label="mês anterior"
        >
          ‹
        </button>
        <span className="calendar-title">{monthLabel(view.year, view.month)}</span>
        <button
          type="button"
          className="nav-button"
          onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
          aria-label="próximo mês"
        >
          ›
        </button>
      </header>

      <div className="weekday-row" aria-hidden="true">
        {weekdayLabels.map((label) => (
          <span key={label} className="weekday-label">
            {label}
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
              isSelected={selected.has(date)}
              hasItems={false}
              onSelect={toggle}
            />
          )
        })}
      </div>

      <p className="selection-summary">
        {value.length === 0
          ? 'Nenhuma data selecionada'
          : `${value.length} data${value.length > 1 ? 's' : ''} selecionada${value.length > 1 ? 's' : ''}`}
      </p>
    </div>
  )
}
