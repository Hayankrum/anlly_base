import type { CSSProperties } from 'react'
import { useHoldToComplete } from '../../../hooks/useHoldToComplete'
import { TaskIcon } from '../../../components/icons/TaskIcon'
import { useSettings } from '../../../hooks/useSettings'
import { addMinutesToTime, formatTimeDisplay } from '../../../utils/time'
import type { AgendaDayItem } from '../../../types/agenda'

interface TrailStepProps {
  item: AgendaDayItem
  /** horizontal anchor of the node, as a fraction of the container width */
  x: number
  /** node the user should tackle next */
  isNext: boolean
  onOpen: (item: AgendaDayItem) => void
  onComplete: (item: AgendaDayItem) => void
}

function metaOf(item: AgendaDayItem, use12h: boolean): string {
  const start = formatTimeDisplay(item.time, use12h)
  if (item.durationMinutes) {
    const end = formatTimeDisplay(addMinutesToTime(item.time, item.durationMinutes), use12h)
    return `${start} → ${end}`
  }
  return start
}

/** One circular stop of the journey plus its floating label. */
export function TrailStep({ item, x, isNext, onOpen, onComplete }: TrailStepProps) {
  const { settings } = useSettings()
  const { progress, holding, holdProps } = useHoldToComplete({
    onComplete: () => onComplete(item),
    onTap: () => onOpen(item),
    disabled: item.done,
  })

  const classNames = ['trail-node-row']
  if (item.done) classNames.push('is-done')
  if (isNext) classNames.push('is-next')
  if (holding) classNames.push('is-holding')

  const side = x > 0.5 ? 'is-left' : 'is-right'

  const ariaLabel = [
    item.title,
    metaOf(item, settings.timeFormat12h),
    item.done ? 'concluído' : 'pendente',
    item.done ? '' : 'toque para ver detalhes, pressione e segure para concluir',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <li
      className={classNames.join(' ')}
      style={{ '--x': x, '--hold': progress } as CSSProperties}
    >
      <span className={`trail-bubble ${side}`}>
        <span className="trail-bubble-title">{item.title}</span>
        <span className="trail-bubble-meta">
          {metaOf(item, settings.timeFormat12h)}
          {item.category ? ` · ${item.category}` : ''}
          {item.alarmEnabled ? ' · lembrete' : ''}
        </span>
        {isNext && !item.done && <span className="trail-bubble-flag">A seguir</span>}
      </span>

      <button type="button" className="trail-hit" aria-label={ariaLabel} {...holdProps}>
        <span className="trail-hold-ring" aria-hidden="true" />
        <span className="trail-node">
          {item.done ? (
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 13 4.5 4.5L19 7" />
            </svg>
          ) : (
            <TaskIcon id={item.icon} size={26} />
          )}
        </span>
      </button>
    </li>
  )
}
