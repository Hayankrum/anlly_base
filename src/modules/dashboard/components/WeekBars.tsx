import { parseDate, weekdayLabel } from '../../../utils/dates'

export interface WeekDayStat {
  date: string
  done: number
  total: number
}

interface WeekBarsProps {
  days: WeekDayStat[]
  today: string
}

/** Column chart of the last seven days: filled part = done, rest = pending. */
export function WeekBars({ days, today }: WeekBarsProps) {
  const peak = Math.max(1, ...days.map((day) => day.total))

  return (
    <div className="week-bars" role="img" aria-label="afazeres dos últimos 7 dias">
      {days.map((day) => {
        const totalPct = Math.round((day.total / peak) * 100)
        const donePct = day.total === 0 ? 0 : Math.round((day.done / day.total) * 100)
        const isToday = day.date === today
        return (
          <div key={day.date} className={`week-bar-col${isToday ? ' is-today' : ''}`}>
            <span className="week-bar-value">{day.total > 0 ? day.done : ''}</span>
            <div className="week-bar-track">
              <div
                className="week-bar-total"
                style={{ height: `${day.total === 0 ? 2 : totalPct}%` }}
              >
                <div className="week-bar-done" style={{ height: `${donePct}%` }} />
              </div>
            </div>
            <span className="week-bar-day">{weekdayLabel(day.date).slice(0, 3)}</span>
            <span className="week-bar-num">{parseDate(day.date)?.day ?? ''}</span>
          </div>
        )
      })}
    </div>
  )
}
