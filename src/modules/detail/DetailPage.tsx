import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useHoldToComplete } from '../../hooks/useHoldToComplete'
import { useJourney } from '../../hooks/useJourney'
import { TaskIcon } from '../../components/icons/TaskIcon'
import { useNavigation } from '../../navigation/useNavigation'
import { useSettings } from '../../hooks/useSettings'
import { formatDateLong, todayStr, weekdayLabel } from '../../utils/dates'
import { recurrenceLabel } from '../../utils/recurrence'
import { reminderLabel } from '../../utils/reminder'
import { addMinutesToTime, formatDurationLabel, formatTimeDisplay } from '../../utils/time'
import type { EventOccurrence, EventWithOccurrences } from '../../types/event'

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}


function pickOccurrence(
  event: EventWithOccurrences,
  occurrenceId?: string,
  date?: string,
): EventOccurrence | undefined {
  if (occurrenceId) {
    const byId = event.occurrences.find((occ) => occ.id === occurrenceId)
    if (byId) return byId
  }
  if (date) {
    const byDate = event.occurrences.find((occ) => occ.date === date)
    if (byDate) return byDate
  }
  return [...event.occurrences].sort((a, b) =>
    `${a.date} ${a.time}` < `${b.date} ${b.time}` ? -1 : 1,
  )[0]
}

interface RowProps {
  label: string
  value: string
}

function Row({ label, value }: RowProps) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function DetailPage() {
  const { current, back } = useNavigation()
  const { events, loading, completeOccurrence, openEdit, removeEvent } = useJourney()
  const { settings } = useSettings()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const event = useMemo(
    () => events.find((candidate) => candidate.id === current.eventId),
    [events, current.eventId],
  )

  // Leaving the screen when the afazer was deleted elsewhere (form, another tab).
  useEffect(() => {
    if (loading || !current.eventId) return
    if (!events.some((candidate) => candidate.id === current.eventId)) back()
  }, [loading, events, current.eventId, back])

  const occurrence = useMemo(
    () => (event ? pickOccurrence(event, current.occurrenceId, current.date) : undefined),
    [event, current.occurrenceId, current.date],
  )

  const done = Boolean(occurrence?.doneAt)

  const { progress, holdProps } = useHoldToComplete({
    onComplete: () => {
      if (occurrence) void completeOccurrence(occurrence.id, true)
    },
    // A short pointer tap must never complete; keyboard activation may.
    onTap: (click) => {
      if (click.detail === 0 && occurrence) void completeOccurrence(occurrence.id, true)
    },
    disabled: done || !occurrence,
  })

  if (!event || !occurrence) {
    return (
      <div className="app-shell detail-shell">
        <header className="detail-topbar">
          <button type="button" className="nav-button" onClick={back} aria-label="voltar">
            <ArrowLeftIcon />
          </button>
        </header>
        <p className="day-empty">Este afazer não existe mais.</p>
      </div>
    )
  }

  const use12h = settings.timeFormat12h
  const timeLabel = event.durationMinutes
    ? `${formatTimeDisplay(occurrence.time, use12h)} → ${formatTimeDisplay(
        addMinutesToTime(occurrence.time, event.durationMinutes),
        use12h,
      )}`
    : formatTimeDisplay(occurrence.time, use12h)

  const dateLabel =
    occurrence.date === todayStr()
      ? 'Hoje'
      : `${weekdayLabel(occurrence.date)}, ${formatDateLong(occurrence.date)}`

  const handleDelete = async () => {
    await removeEvent(event.id)
    back()
  }

  return (
    <div className="app-shell detail-shell">
      <header className="detail-topbar">
        <button type="button" className="nav-button" onClick={back} aria-label="voltar">
          <ArrowLeftIcon />
        </button>
        <span className="detail-topbar-title">Afazer</span>
        <button
          type="button"
          className="detail-edit"
          onClick={() => openEdit(event.id)}
        >
          Editar
        </button>
      </header>

      <section className="detail-hero" style={{ '--event-color': event.color } as CSSProperties}>
        <span className="detail-icon" aria-hidden="true">
          <TaskIcon id={event.icon} size={38} />
        </span>
        <h1 className="detail-title">{event.title}</h1>
        <span className={`status-chip${done ? ' is-done' : ''}`}>
          {done ? 'Concluído' : 'Pendente'}
        </span>
      </section>

      <dl className="detail-list">
        <Row label="Data" value={dateLabel} />
        <Row label="Horário" value={timeLabel} />
        {event.durationMinutes !== null && (
          <Row label="Duração" value={formatDurationLabel(event.durationMinutes * 60)} />
        )}
        <Row label="Categoria" value={event.category?.trim() || '—'} />
        <Row label="Repetição" value={recurrenceLabel(event.recurrence, event.recurrenceDays)} />
        <Row
          label="Lembrete"
          value={reminderLabel(occurrence.alarmEnabled, occurrence.alarmMinutesBefore)}
        />
      </dl>

      {event.description?.trim() && (
        <section className="detail-description">
          <h2 className="section-title">Descrição</h2>
          <p>{event.description}</p>
        </section>
      )}

      <div className="detail-complete">
        {done ? (
          <>
            <p className="detail-complete-note">Concluído {formatDoneAt(occurrence.doneAt, use12h)}</p>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => void completeOccurrence(occurrence.id, false)}
            >
              Desfazer conclusão
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`hold-button${progress > 0 ? ' is-holding' : ''}`}
            style={{ '--hold': progress } as CSSProperties}
            {...holdProps}
          >
            <span className="hold-button-fill" aria-hidden="true" />
            <span className="hold-button-label">Segure para concluir</span>
          </button>
        )}
      </div>

      <div className="delete-section">
        {confirmDelete ? (
          <div className="confirm-box">
            <p>Excluir este afazer, todas as datas e lembretes associados?</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Voltar
              </button>
              <button type="button" className="button button-danger" onClick={() => void handleDelete()}>
                Excluir
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button button-danger-outline"
            onClick={() => setConfirmDelete(true)}
          >
            Excluir afazer
          </button>
        )}
      </div>
    </div>
  )
}

function formatDoneAt(iso: string | null, use12h: boolean): string {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  const hh = String(parsed.getHours()).padStart(2, '0')
  const mm = String(parsed.getMinutes()).padStart(2, '0')
  return `às ${formatTimeDisplay(`${hh}:${mm}`, use12h)}`
}
