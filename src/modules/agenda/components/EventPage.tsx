import { EventForm } from './EventForm'
import type { EventInput, EventWithOccurrences } from '../../../types/event'

interface EventPageProps {
  /** When present the form edits this event, otherwise it creates a new one. */
  event?: EventWithOccurrences
  onClose: () => void
  onSave: (input: EventInput, eventId?: string) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
}

function toInput(event: EventWithOccurrences): EventInput {
  const first = event.occurrences[0]
  const sorted = [...event.occurrences].sort((a, b) => (a.date < b.date ? -1 : 1))
  return {
    title: event.title,
    description: event.description ?? '',
    category: event.category ?? '',
    color: event.color,
    dates: sorted.map((occ) => occ.date),
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
          <h2>{isEdit ? 'Editar evento' : 'Novo evento'}</h2>
          <button type="button" className="nav-button" onClick={onClose} aria-label="fechar">
            ✕
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
