import { useCallback, useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  calendarWeekdayLabels,
  formatWeekRange,
  getDaysInMonth,
  makeDate,
  monthLabel,
  parseDate,
  todayStr,
  weekOf,
} from '../../../utils/dates'
import { useSettings } from '../../../hooks/useSettings'
import type { AgendaDayItem, CalendarSources } from '../../../types/agenda'
import { buildAgendaItems, compareAgendaItems } from '../items'

interface UseCalendarResult {
  year: number
  month: number
  label: string
  selectedDate: string
  today: string
  /** first event color per date (YYYY-MM-DD -> hex) */
  dayColors: Map<string, string>
  /** items of the selected date, sorted for display */
  dayItems: AgendaDayItem[]
  /** Monday..Sunday (or Sunday..Saturday) week containing the selected date */
  weekDays: string[]
  /** true = grids start on Monday, false = start on Sunday */
  startOnMonday: boolean
  /** weekday labels in grid column order */
  weekdayLabels: string[]
  /** "21 – 27 de Setembro" */
  weekLabel: string
  selectDate: (date: string) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToPrevYear: () => void
  goToNextYear: () => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToPrevDay: () => void
  goToNextDay: () => void
  goToToday: () => void
  /** selects the date and moves the month view to it */
  goTo: (date: string) => void
}

interface UseCalendarOptions {
  /** YYYY-MM-DD the calendar opens on (defaults to today) */
  initialDate?: string
}

export function useCalendar(
  sources: CalendarSources,
  options: UseCalendarOptions = {},
): UseCalendarResult {
  const { events } = sources
  const { settings } = useSettings()
  const startOnMonday = settings.weekStartsOn === 'mon'
  const weekdayLabels = useMemo(
    () => calendarWeekdayLabels(startOnMonday),
    [startOnMonday],
  )
  const today = todayStr()
  const initial = options.initialDate && parseDate(options.initialDate) ? options.initialDate : today
  const initialParts = parseDate(initial) ?? parseDate(today) ?? { year: 2026, month: 1, day: 1 }

  const [view, setView] = useState(() => ({ year: initialParts.year, month: initialParts.month }))
  const [selectedDate, setSelectedDate] = useState(initial)

  const items = useMemo(() => buildAgendaItems({ events }), [events])

  const sorted = useMemo(() => [...items].sort(compareAgendaItems), [items])

  const dayColors = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of sorted) {
      if (!map.has(item.date)) map.set(item.date, item.color)
    }
    return map
  }, [sorted])

  const dayItems = useMemo(
    () => sorted.filter((item) => item.date === selectedDate),
    [sorted, selectedDate],
  )

  const weekDays = useMemo(
    () => weekOf(selectedDate, startOnMonday),
    [selectedDate, startOnMonday],
  )
  const weekLabel = useMemo(() => formatWeekRange(weekDays[0], weekDays[6]), [weekDays])

  /** Moves the view and keeps the selected day, clamped to the new month. */
  const moveMonth = useCallback((delta: number) => {
    const parts = parseDate(selectedDate) ?? parseDate(todayStr())
    if (!parts) return
    const target = addMonths(parts.year, parts.month, delta)
    const day = Math.min(parts.day, getDaysInMonth(target.year, target.month))
    setView(target)
    setSelectedDate(makeDate(target.year, target.month, day))
  }, [selectedDate])

  const goToPrevMonth = () => moveMonth(-1)
  const goToNextMonth = () => moveMonth(1)
  const goToPrevYear = () => moveMonth(-12)
  const goToNextYear = () => moveMonth(12)
  const goToToday = () => {
    const t = todayStr()
    const parts = parseDate(t)
    if (parts) setView({ year: parts.year, month: parts.month })
    setSelectedDate(t)
  }
  const goTo = useCallback((date: string) => {
    const parts = parseDate(date)
    if (parts) setView({ year: parts.year, month: parts.month })
    setSelectedDate(date)
  }, [])

  const goToPrevWeek = () => goTo(addDays(selectedDate, -7))
  const goToNextWeek = () => goTo(addDays(selectedDate, 7))
  const goToPrevDay = () => goTo(addDays(selectedDate, -1))
  const goToNextDay = () => goTo(addDays(selectedDate, 1))

  return {
    year: view.year,
    month: view.month,
    label: monthLabel(view.year, view.month),
    selectedDate,
    today,
    dayColors,
    dayItems,
    weekDays,
    startOnMonday,
    weekdayLabels,
    weekLabel,
    selectDate: setSelectedDate,
    goToPrevMonth,
    goToNextMonth,
    goToPrevYear,
    goToNextYear,
    goToPrevWeek,
    goToNextWeek,
    goToPrevDay,
    goToNextDay,
    goToToday,
    goTo,
  }
}
