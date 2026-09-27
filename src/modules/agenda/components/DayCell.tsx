import type { DateStr } from '../../../utils/dates'

interface DayCellProps {
  date: DateStr
  dayNumber: number
  isToday: boolean
  isSelected: boolean
  hasItems: boolean
  /** first item color for this date (defaults to the accent color) */
  dotColor?: string
  onSelect: (date: DateStr) => void
}

export function DayCell({
  date,
  dayNumber,
  isToday,
  isSelected,
  hasItems,
  dotColor,
  onSelect,
}: DayCellProps) {
  const classNames = ['day-cell']
  if (isToday) classNames.push('is-today')
  if (isSelected) classNames.push('is-selected')
  if (hasItems) classNames.push('has-events')

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      onClick={() => onSelect(date)}
      aria-pressed={isSelected}
      aria-label={`dia ${dayNumber}`}
    >
      <span className="day-number">{dayNumber}</span>
      <span
        className="day-dot"
        aria-hidden="true"
        style={dotColor ? { background: dotColor } : undefined}
      />
    </button>
  )
}
