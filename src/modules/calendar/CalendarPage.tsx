import { useCallback, useEffect, useMemo, useState } from 'react'
import { MonthCalendar } from '../agenda/components/MonthCalendar'
import { WeekView } from '../agenda/components/WeekView'
import { DayNavigator } from '../agenda/components/DayNavigator'
import { YearView } from '../agenda/components/YearView'
import { DayTimeline } from './DayTimeline'
import { useCalendar } from '../agenda/hooks/useCalendar'
import { buildAgendaItems, compareAgendaItems } from '../agenda/items'
import { useJourney } from '../../hooks/useJourney'
import { useNavigation } from '../../navigation/useNavigation'
import type { AgendaDayItem } from '../../types/agenda'

type CalendarView = 'day' | 'week' | 'month'

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
]

/** Day browsing: Dia / Semana / Mês / Ano plus the list of the selected day. */
export function CalendarPage() {
  const { current, push } = useNavigation()
  const { events, error, loading } = useJourney()

  const calendar = useCalendar({ events }, { initialDate: current.date })
  const goTo = calendar.goTo
  const navDate = current.date
  useEffect(() => {
    if (navDate) goTo(navDate)
  }, [navDate, goTo])

  const [view, setView] = useState<CalendarView>('month')
  const [yearView, setYearView] = useState(false)

  const items = useMemo(() => buildAgendaItems({ events }), [events])

  const dayItems = useMemo(
    () => items.filter((item) => item.date === calendar.selectedDate).sort(compareAgendaItems),
    [items, calendar.selectedDate],
  )

  const openItem = useCallback(
    (item: AgendaDayItem) => {
      push({ area: 'detalhe', eventId: item.refId, occurrenceId: item.id, date: item.date })
    },
    [push],
  )

  const selectFromYear = (date: string) => {
    calendar.goTo(date)
    setYearView(false)
  }

  return (
    <div className="app-shell calendar-shell">
      <header className="area-header">
        <h1 className="page-title">Calendário</h1>
        <div className="segmented" role="radiogroup" aria-label="visualização do calendário">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={view === option.id}
              className={`segment${view === option.id ? ' is-active' : ''}`}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {yearView ? (
        <YearView
          year={calendar.year}
          today={calendar.today}
          selectedDate={calendar.selectedDate}
          dayColors={calendar.dayColors}
          startOnMonday={calendar.startOnMonday}
          onSelectDate={selectFromYear}
          onPrevYear={calendar.goToPrevYear}
          onNextYear={calendar.goToNextYear}
          onClose={() => setYearView(false)}
        />
      ) : view === 'month' ? (
        <MonthCalendar
          year={calendar.year}
          month={calendar.month}
          label={calendar.label}
          selectedDate={calendar.selectedDate}
          today={calendar.today}
          dayColors={calendar.dayColors}
          startOnMonday={calendar.startOnMonday}
          weekdayLabels={calendar.weekdayLabels}
          onSelectDate={calendar.selectDate}
          onPrevMonth={calendar.goToPrevMonth}
          onNextMonth={calendar.goToNextMonth}
          onOpenYear={() => setYearView(true)}
        />
      ) : view === 'week' ? (
        <WeekView
          label={calendar.weekLabel}
          weekDays={calendar.weekDays}
          weekdayLabels={calendar.weekdayLabels}
          selectedDate={calendar.selectedDate}
          today={calendar.today}
          dayColors={calendar.dayColors}
          onSelectDate={calendar.selectDate}
          onPrevWeek={calendar.goToPrevWeek}
          onNextWeek={calendar.goToNextWeek}
          onOpenYear={() => setYearView(true)}
        />
      ) : (
        <DayNavigator
          date={calendar.selectedDate}
          onPrevDay={calendar.goToPrevDay}
          onNextDay={calendar.goToNextDay}
          onOpenYear={() => setYearView(true)}
        />
      )}

      {error && <p className="global-error">{error}</p>}

      {!yearView && (
        <section className="timeline-section">
          <header className="chart-head">
            <h2 className="section-title">Mapa de horas</h2>
            <span className="timeline-date">
              {view === 'month' ? calendar.selectedDate.split('-').reverse().join('/') : ''}
            </span>
          </header>
          <DayTimeline date={calendar.selectedDate} items={dayItems} onOpenItem={openItem} />
        </section>
      )}

      {loading && <p className="loading-indicator">Carregando…</p>}
    </div>
  )
}
