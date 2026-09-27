import { useEffect, useMemo, useState } from 'react'
import { Trail } from './components/Trail'
import { TaskIcon } from '../../components/icons/TaskIcon'
import { useJourney } from '../../hooks/useJourney'
import { useSettings } from '../../hooks/useSettings'
import { useNavigation } from '../../navigation/useNavigation'
import { buildAgendaItems, compareAgendaItems } from '../agenda/items'
import { formatDateLong, todayStr, weekdayLabel } from '../../utils/dates'
import { formatTimeDisplay } from '../../utils/time'
import type { AgendaDayItem } from '../../types/agenda'

function greeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function clockOf(now: Date, use12h: boolean): string {
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return formatTimeDisplay(`${hh}:${mm}`, use12h)
}

export function HomePage() {
  const { events, loading, error, completeOccurrence, openCreate } = useJourney()
  const { push } = useNavigation()
  const { settings } = useSettings()
  const [now, setNow] = useState(() => new Date())

  // O relógio da home acompanha o minuto sem re-renderizar o app inteiro.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(id)
  }, [])

  const today = todayStr()

  const items = useMemo(() => {
    return buildAgendaItems({ events })
      .filter((item) => item.date === today)
      .sort(compareAgendaItems)
  }, [events, today])

  const doneCount = items.filter((item) => item.done).length
  const percent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100)

  const openDetail = (item: AgendaDayItem) => {
    push({ area: 'detalhe', eventId: item.refId, occurrenceId: item.id, date: item.date })
  }

  return (
    <div className="app-shell home-shell">
      <header className="home-hero">
        <div className="home-hero-text">
          <p className="home-greeting">{greeting(now)}</p>
          <h1 className="home-date">
            {weekdayLabel(today)}, {formatDateLong(today)}
          </h1>
          <p className="home-clock">{clockOf(now, settings.timeFormat12h)}</p>
        </div>

        {items.length > 0 && (
          <div className="home-hero-progress" aria-label={`${percent}% concluído`}>
            <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true">
              <circle className="home-hero-ring-track" cx="24" cy="24" r="20" />
              <circle
                className="home-hero-ring-fill"
                cx="24"
                cy="24"
                r="20"
                strokeDasharray={`${(2 * Math.PI * 20 * percent) / 100} ${2 * Math.PI * 20}`}
              />
            </svg>
            <span className="home-hero-percent">{percent}%</span>
          </div>
        )}
      </header>

      {items.length > 0 && (
        <p className="home-hero-note">
          {doneCount === items.length
            ? 'Tudo concluído por hoje — descanso merecido.'
            : `Faltam ${items.length - doneCount} ${items.length - doneCount === 1 ? 'passo' : 'passos'} para chegar na chegada.`}
        </p>
      )}

      {error && <p className="global-error">{error}</p>}

      <section className="home-journey">
        <div className="section-head">
          <h2 className="section-title">Sua jornada de hoje</h2>
          {items.length > 0 && (
            <span className="section-count">
              {doneCount}/{items.length}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="home-empty">
            <span className="home-empty-badge" aria-hidden="true">
              <TaskIcon id="sprout" size={34} />
            </span>
            <p className="home-empty-title">
              {loading ? 'Carregando…' : 'Seu caminho ainda está vazio'}
            </p>
            {!loading && (
              <>
                <p className="home-empty-note">Adicione o primeiro passo da sua jornada.</p>
                <button type="button" className="button button-primary" onClick={openCreate}>
                  Criar primeiro afazer
                </button>
              </>
            )}
          </div>
        ) : (
          <Trail
            items={items}
            onOpen={openDetail}
            onComplete={(item) => void completeOccurrence(item.id)}
          />
        )}
      </section>
    </div>
  )
}
