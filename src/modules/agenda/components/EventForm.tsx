import { useMemo, useState } from 'react'
import { DateMultiSelect } from './DateMultiSelect'
import { validateEventInput } from '../../../services/eventService'
import { colorForCategory } from '../../../utils/colors'
import { TASK_ICONS, normalizeIcon } from '../../../utils/icons'
import { TaskIcon } from '../../../components/icons/TaskIcon'
import {
  RECURRENCE_OPTIONS,
  WEEKDAY_SHORT,
  expandRecurrence,
  normalizeWeekdays,
  weekdayIndex,
} from '../../../utils/recurrence'
import { REMINDER_OPTIONS, reminderFromValue, reminderValue } from '../../../utils/reminder'
import { formatDurationLabel, normalizeTimeInput } from '../../../utils/time'
import type { EventInput, RecurrenceRule } from '../../../types/event'

const CATEGORY_SUGGESTIONS = ['Casa', 'Estudos', 'Trabalho', 'Pessoal', 'Saúde', 'Financeiro']

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240, 480]

function durationLabel(minutes: number): string {
  return formatDurationLabel(minutes * 60)
}

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
  const [icon, setIcon] = useState(normalizeIcon(initial?.icon))
  /** A cor acompanha a categoria — sem seletor manual de cor. */
  const color = colorForCategory(category)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    initial?.durationMinutes ?? null,
  )
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(initial?.recurrence ?? 'none')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    normalizeWeekdays(initial?.recurrenceDays ?? []),
  )
  const [dates, setDates] = useState<string[]>(initial?.dates ?? [])
  const [time, setTime] = useState(initial?.time ?? '08:00')
  const [alarmEnabled, setAlarmEnabled] = useState(initial?.alarmEnabled ?? false)
  const [alarmMinutesBefore, setAlarmMinutesBefore] = useState(initial?.alarmMinutesBefore ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isRepeating = recurrence !== 'none'
  const generatedCount = useMemo(
    () => expandRecurrence(dates, recurrence, recurrenceDays).length,
    [dates, recurrence, recurrenceDays],
  )

  /** Weekdays already implied by the dates picked in the calendar. */
  const weekdaysFromDates = useMemo(
    () => normalizeWeekdays(dates.map((date) => weekdayIndex(date))),
    [dates],
  )

  const toggleWeekday = (day: number) => {
    setRecurrenceDays((current) =>
      current.includes(day)
        ? normalizeWeekdays(current.filter((value) => value !== day))
        : normalizeWeekdays([...current, day]),
    )
  }

  /** Turns the manually picked dates into a weekday rule. */
  const repeatPickedDays = () => {
    const days = weekdaysFromDates
    if (days.length === 0) return
    const sorted = [...dates].sort()
    setRecurrenceDays(days)
    setRecurrence('custom')
    setDates(sorted.length > 0 ? [sorted[0]] : [])
  }

  const durationSelectValue = durationMinutes === null ? 'none' : String(durationMinutes)
  const durationValues =
    durationMinutes !== null && !DURATION_OPTIONS.includes(durationMinutes)
      ? [...DURATION_OPTIONS, durationMinutes].sort((a, b) => a - b)
      : DURATION_OPTIONS

  const buildInput = (): EventInput => ({
    title,
    description,
    category,
    icon,
    color,
    durationMinutes,
    recurrence,
    recurrenceDays: normalizeWeekdays(recurrenceDays),
    dates,
    time: normalizeTimeInput(time) ?? time,
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
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o afazer.')
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
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o afazer.')
      setSaving(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="event-form">
      <label className="field">
        <span className="field-label">Nome</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Lavar roupa"
          maxLength={120}
          autoFocus={!isEdit}
        />
      </label>

      <fieldset className="field field-icons">
        <legend className="field-label">Ícone</legend>
        <div className="icon-grid" role="radiogroup" aria-label="ícone do afazer">
          {TASK_ICONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={icon === option}
              aria-label={`ícone ${option}`}
              className={`icon-option${icon === option ? ' is-selected' : ''}`}
              onClick={() => setIcon(option)}
            >
              <TaskIcon id={option} size={24} />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field-label">
          Categoria
          <span className="category-dot" style={{ background: color }} aria-hidden="true" />
        </span>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex.: Casa"
          maxLength={40}
          list="category-suggestions"
        />
        <datalist id="category-suggestions">
          {CATEGORY_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </label>

      <label className="field field-inline">
        <span className="field-label">Repetição</span>
        <select
          value={recurrence}
          onChange={(e) => {
            const next = e.target.value as RecurrenceRule
            setRecurrence(next)
            if (next === 'custom' && recurrenceDays.length === 0 && weekdaysFromDates.length > 0) {
              setRecurrenceDays(weekdaysFromDates)
            }
          }}
        >
          {RECURRENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {recurrence === 'none' && dates.length > 0 && weekdaysFromDates.length > 0 && (
        <button type="button" className="button button-ghost repeat-picked" onClick={repeatPickedDays}>
          Repetir nesses dias
        </button>
      )}

      {recurrence === 'custom' && (
        <fieldset className="field field-weekdays">
          <legend className="field-label">Repetir nesses dias</legend>
          <div className="weekday-toggles" role="group" aria-label="dias da semana">
            {WEEKDAY_SHORT.map((label, day) => (
              <button
                key={label}
                type="button"
                aria-pressed={recurrenceDays.includes(day)}
                aria-label={`repetir ${label}`}
                className={`weekday-toggle${recurrenceDays.includes(day) ? ' is-on' : ''}`}
                onClick={() => toggleWeekday(day)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="field-note">
            {recurrenceDays.length === 0
              ? 'Marque ao menos um dia.'
              : `${generatedCount} datas geradas`}
          </p>
        </fieldset>
      )}

      {isRepeating ? (
        <label className="field field-inline">
          <span className="field-label">
            Data inicial
            <span className="field-note">{generatedCount} datas geradas</span>
          </span>
          <input
            type="date"
            value={dates[0] ?? ''}
            onChange={(e) => setDates(e.target.value ? [e.target.value] : [])}
          />
        </label>
      ) : (
        <fieldset className="field field-dates">
          <legend className="field-label">Datas</legend>
          <DateMultiSelect value={dates} onChange={setDates} />
        </fieldset>
      )}

      <label className="field field-inline">
        <span className="field-label">Horário</span>
        <input
          type="text"
          inputMode="numeric"
          value={time}
          placeholder="HH:mm"
          maxLength={10}
          onChange={(e) => setTime(e.target.value)}
          onBlur={() => setTime((current) => normalizeTimeInput(current) ?? current)}
        />
      </label>

      <label className="field field-inline">
        <span className="field-label">Duração</span>
        <select
          value={durationSelectValue}
          onChange={(e) =>
            setDurationMinutes(e.target.value === 'none' ? null : Number(e.target.value))
          }
        >
          <option value="none">Sem duração</option>
          {durationValues.map((minutes) => (
            <option key={minutes} value={minutes}>
              {durationLabel(minutes)}
            </option>
          ))}
        </select>
      </label>

      <label className="field field-inline">
        <span className="field-label">Lembrete</span>
        <select
          value={reminderValue(alarmEnabled, alarmMinutesBefore)}
          onChange={(e) => {
            const reminder = reminderFromValue(e.target.value)
            setAlarmEnabled(reminder.enabled)
            setAlarmMinutesBefore(reminder.minutes)
          }}
        >
          {REMINDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
          {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar afazer'}
        </button>
      </div>

      {isEdit && onDelete && (
        <div className="delete-section">
          {confirmingDelete ? (
            <div className="confirm-box">
              <p>Excluir este afazer, todas as datas e lembretes associados?</p>
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
              Excluir afazer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
