import { EventForm } from './EventForm'
import { normalizeIcon } from '../../../utils/icons'
import type { EventInput, EventWithOccurrences } from '../../../types/event'

interface EventPageProps {
  /** When present the form edits this afazer, otherwise it creates a new one. */
  event?: EventWithOccurrences
  onClose: () => void
  onSave: (input: EventInput, eventId?: string) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
}

function toInput(event: EventWithOccurrences): EventInput {
  const sorted = [...event.occurrences].sort((a, b) => (a.date < b.date ? -1 : 1))
  const first = sorted[0]
  return {
    title: event.title,
    description: event.description ?? '',
    category: event.category ?? '',
    icon: normalizeIcon(event.icon),
    color: event.color,
    durationMinutes: event.durationMinutes,
    recurrence: event.recurrence,
    recurrenceDays: [...event.recurrenceDays],
    // A repeating afazer is anchored on its earliest date; the rule rebuilds the rest.
    dates: event.recurrence === 'none' ? sorted.map((occ) => occ.date) : [first?.date ?? ''],
    time: first?.time ?? '08:00',
    alarmEnabled: first?.alarmEnabled ?? false,
    alarmMinutesBefore: first?.alarmMinutesBefore ?? 0,
  }
}

export function EventPage({ event, onClose, onSave, onDelete }: EventPageProps) {
  const isEdit = Boolean(event)

  const handleSave = async (input: EventInput) => {
    await onSave(input, event?.id)
    onClose()
  }

  const handleDelete = async () => {
    if (!event) return
    await onDelete(event.id)
    onClose()
  }

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="sheet">
        <header className="sheet-header">
          <h2>{isEdit ? 'Editar afazer' : 'Novo afazer'}</h2>
          <button type="button" className="nav-button" onClick={onClose} aria-label="fechar">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <EventForm
          initial={event ? toInput(event) : undefined}
          isEdit={isEdit}
          onSave={handleSave}
          onCancel={onClose}
          onDelete={isEdit ? handleDelete : undefined}
        />
      </div>
    </div>
  )
}
