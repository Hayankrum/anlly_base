import { useCallback, useEffect, useMemo, useState } from 'react'
import { MonthCalendar } from './components/MonthCalendar'
import { WeekView } from './components/WeekView'
import { DayNavigator } from './components/DayNavigator'
import { YearView } from './components/YearView'
import { AgendaDayList } from './components/AgendaDayList'
import { AlarmPermissionNotice } from '../../components/Alarm/AlarmPermissionNotice'
import { EventPage } from './components/EventPage'
import { useCalendar } from './hooks/useCalendar'
import { useEvents } from './hooks/useEvents'
import { useNavigation } from '../../navigation/useNavigation'
import type { EventInput } from '../../types/event'

type AgendaView = 'day' | 'week' | 'month'

const VIEWS: { id: AgendaView; label: string }[] = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
]

export function AgendaPage() {
  const { current } = useNavigation()
  const { events, loading, error, saveEvent, removeEvent } = useEvents()

  const calendar = useCalendar(
    { events },
    { initialDate: current.date },
  )
  const goTo = calendar.goTo
  const navDate = current.date
  useEffect(() => {
    if (navDate) goTo(navDate)
  }, [navDate, goTo])

  const [view, setView] = useState<AgendaView>('month')
  const [creating, setCreating] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [yearView, setYearView] = useState(false)

  const editingEvent = useMemo(
    () => events.find((event) => event.id === editingEventId),
    [events, editingEventId],
  )

  const openCreate = () => {
    setEditingEventId(null)
    setCreating(true)
  }

  const openEdit = useCallback((eventId: string) => {
    setCreating(false)
    setEditingEventId(eventId)
  }, [])

  const closeSheet = () => {
    setCreating(false)
    setEditingEventId(null)
  }

  const handleSave = async (input: EventInput, eventId?: string) => {
    await saveEvent(input, eventId)
  }

  const handleDelete = async (eventId: string) => {
    await removeEvent(eventId)
  }

  const selectFromYear = (date: string) => {
    calendar.goTo(date)
    setYearView(false)
  }

  const showSheet = creating || Boolean(editingEvent)

  return (
    <div className="app-shell">
      <header className="area-header">
        <h1 className="page-title">Agenda</h1>
        <div className="segmented" role="radiogroup" aria-label="visualização da agenda">
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

      <AlarmPermissionNotice />

      {error && <p className="global-error">{error}</p>}

      {!yearView && (
        <AgendaDayList
          date={calendar.selectedDate}
          items={calendar.dayItems}
          hideHeading={view === 'day'}
          onOpenItem={openEdit}
        />
      )}

      <button type="button" className="fab" onClick={openCreate} aria-label="criar evento">
        +
      </button>

      {loading && <p className="loading-indicator">Carregando…</p>}

      {showSheet && (
        <EventPage
          event={editingEvent}
          onClose={closeSheet}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
