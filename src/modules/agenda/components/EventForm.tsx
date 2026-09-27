import { useState } from 'react'
import { DateMultiSelect } from './DateMultiSelect'
import { validateEventInput } from '../../../services/eventService'
import { DEFAULT_EVENT_COLOR, EVENT_COLORS } from '../../../utils/colors'
import type { EventInput } from '../../../types/event'

const ALARM_OPTIONS = [
  { value: 0, label: 'No horário' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
]

interface EventFormProps {
  initial?: Partial<EventInput>
  isEdit?: boolean
  onSave: (input: EventInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

export function EventForm({ initial, isEdit = false, onSave, onCancel, onDelete }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [color, setColor] = useState(initial?.color ?? DEFAULT_EVENT_COLOR)
  const [dates, setDates] = useState<string[]>(initial?.dates ?? [])
  const [time, setTime] = useState(initial?.time ?? '08:00')
  const [alarmEnabled, setAlarmEnabled] = useState(initial?.alarmEnabled ?? false)
  const [alarmMinutesBefore, setAlarmMinutesBefore] = useState(initial?.alarmMinutesBefore ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const buildInput = (): EventInput => ({
    title,
    description,
    category,
    color,
    dates,
    time,
    alarmEnabled,
    alarmMinutesBefore,
  })

  const handleSave = async () => {
    const input = buildInput()
    const validationError = validateEventInput(input)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave(input)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o evento.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setSaving(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o evento.')
      setSaving(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="event-form">
      <label className="field">
        <span className="field-label">Título</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Estudar para prova"
          maxLength={120}
          autoFocus={!isEdit}
        />
      </label>

      <label className="field">
        <span className="field-label">Descrição</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
          rows={3}
        />
      </label>

      <label className="field">
        <span className="field-label">Categoria</span>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex.: Estudos"
          maxLength={40}
        />
      </label>

      <fieldset className="field field-colors">
        <legend className="field-label">Cor</legend>
        <div className="color-swatches" role="radiogroup" aria-label="cor do evento">
          {EVENT_COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={color.toLowerCase() === option.value}
              aria-label={option.name}
              title={option.name}
              className={`color-swatch${color.toLowerCase() === option.value ? ' is-selected' : ''}`}
              style={{ background: option.value }}
              onClick={() => setColor(option.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="field field-dates">
        <legend className="field-label">Datas</legend>
        <DateMultiSelect value={dates} onChange={setDates} />
      </fieldset>

      <label className="field field-inline">
        <span className="field-label">Horário</span>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>

      <label className="field field-inline">
        <span className="field-label">Alarme</span>
        <span className="toggle">
          <input
            type="checkbox"
            checked={alarmEnabled}
            onChange={(e) => setAlarmEnabled(e.target.checked)}
          />
          <span className="toggle-track" aria-hidden="true" />
        </span>
      </label>

      {alarmEnabled && (
        <label className="field field-inline">
          <span className="field-label">Aviso</span>
          <select
            value={alarmMinutesBefore}
            onChange={(e) => setAlarmMinutesBefore(Number(e.target.value))}
          >
            {ALARM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="button button-ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {isEdit && onDelete && (
        <div className="delete-section">
          {confirmingDelete ? (
            <div className="confirm-box">
              <p>Excluir este evento, todas as datas e alarmes associados?</p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={saving}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Excluir
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="button button-danger-outline"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving}
            >
              Excluir evento
            </button>
          )}
        </div>
      )}
    </div>
  )
}
