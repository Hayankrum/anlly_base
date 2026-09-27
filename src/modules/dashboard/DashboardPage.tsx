import { useMemo } from 'react'
import { AlarmPermissionNotice } from '../../components/Alarm/AlarmPermissionNotice'
import { buildAgendaItems } from '../agenda/items'
import { useJourney } from '../../hooks/useJourney'
import { useSettings } from '../../hooks/useSettings'
import { addDays, todayStr, weekOf } from '../../utils/dates'
import { CategoryBars, type CategoryStat } from './components/CategoryBars'
import { RingChart } from './components/RingChart'
import { StatTile } from './components/StatTile'
import { WeekBars, type WeekDayStat } from './components/WeekBars'

/**
 * Numbers page — charts only. The day-by-day list lives in the calendar
 * so nothing is shown twice.
 */
export function DashboardPage() {
  const { events, error, loading } = useJourney()
  const { settings } = useSettings()

  const today = todayStr()
  const items = useMemo(() => buildAgendaItems({ events }), [events])

  const weekDates = useMemo(
    () => weekOf(today, settings.weekStartsOn === 'mon'),
    [today, settings.weekStartsOn],
  )
  const weekStats = useMemo(() => {
    const inWeek = weekDates.length
      ? items.filter((item) => weekDates.includes(item.date))
      : []
    const done = inWeek.filter((item) => item.done).length
    return { total: inWeek.length, done, pending: inWeek.length - done }
  }, [items, weekDates])

  const weekPercent =
    weekStats.total === 0 ? 0 : Math.round((weekStats.done / weekStats.total) * 100)

  const last7 = useMemo<WeekDayStat[]>(() => {
    const days: WeekDayStat[] = []
    for (let offset = 6; offset >= 0; offset--) {
      const date = addDays(today, -offset)
      const dayItems = items.filter((item) => item.date === date)
      days.push({
        date,
        total: dayItems.length,
        done: dayItems.filter((item) => item.done).length,
      })
    }
    return days
  }, [items, today])

  /** Consecutive days with at least one completion, ending today or yesterday. */
  const streak = useMemo(() => {
    const doneByDate = new Map<string, number>()
    for (const item of items) {
      if (item.done) doneByDate.set(item.date, (doneByDate.get(item.date) ?? 0) + 1)
    }
    let cursor = today
    if (!doneByDate.get(cursor)) cursor = addDays(cursor, -1)
    let count = 0
    while (doneByDate.get(cursor)) {
      count += 1
      cursor = addDays(cursor, -1)
    }
    return count
  }, [items, today])

  const monthStats = useMemo(() => {
    const monthKey = today.slice(0, 7)
    const map = new Map<string, CategoryStat>()
    let done = 0
    for (const item of items) {
      if (item.date.slice(0, 7) !== monthKey) continue
      if (item.done) done += 1
      const key = item.category?.trim() || 'Sem categoria'
      const entry = map.get(key) ?? { name: key, total: 0, done: 0 }
      entry.total += 1
      if (item.done) entry.done += 1
      map.set(key, entry)
    }
    const rows = [...map.values()].sort((a, b) => b.total - a.total)
    return { rows, done }
  }, [items, today])

  const todayDone = last7.at(-1)?.done ?? 0
  const todayTotal = last7.at(-1)?.total ?? 0

  return (
    <div className="app-shell dashboard-shell">
      <h1 className="page-title">Dashboard</h1>

      {error && <p className="global-error">{error}</p>}

      <AlarmPermissionNotice />

      <section className="stat-grid" aria-label="resumo">
        <StatTile
          label="Esta semana"
          value={`${weekPercent}%`}
          sub={`${weekStats.done}/${weekStats.total}`}
          tone="accent"
          icon={<RingChart percent={weekPercent} size={42} stroke={6} />}
        />
        <StatTile
          label="Sequência"
          value={streak}
          sub={streak === 1 ? 'dia seguido' : 'dias seguidos'}
          tone="gold"
          icon={<FlameIcon />}
        />
        <StatTile
          label="Hoje"
          value={`${todayDone}/${todayTotal}`}
          sub="concluídos hoje"
          tone="done"
          icon={<CheckIcon />}
        />
      </section>

      <section className="chart-card">
        <header className="chart-head">
          <h2 className="section-title">Últimos 7 dias</h2>
          <span className="chart-legend">
            <span className="legend-dot is-done" aria-hidden="true" />
            concluídos
            <span className="legend-dot is-total" aria-hidden="true" />
            planejados
          </span>
        </header>
        <WeekBars days={last7} today={today} />
      </section>

      <section className="chart-card">
        <header className="chart-head">
          <h2 className="section-title">Categorias do mês</h2>
          <span className="chart-legend">
            <span className="legend-dot is-done" aria-hidden="true" />
            concluídos
          </span>
        </header>
        <CategoryBars rows={monthStats.rows} />
      </section>

      {loading && <p className="loading-indicator">Carregando…</p>}
    </div>
  )
}

function FlameIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5c.6 3-1.4 4.2-2.8 5.6-1.6 1.6-2.7 3.1-2.7 5.4A5.5 5.5 0 0 0 12 20a5.5 5.5 0 0 0 5.5-5.5c0-2.6-1.4-4-2.7-5.4-.6 1-1.3 1.5-2.1 1.7.9-2.6.5-5.4-.7-7.3Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  )
}
