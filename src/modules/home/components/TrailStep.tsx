import type { CSSProperties } from 'react'
import { useHoldToComplete } from '../../../hooks/useHoldToComplete'
import { useTicker } from '../../../hooks/useTicker'
import { TaskIcon } from '../../../components/icons/TaskIcon'
import { useSettings } from '../../../hooks/useSettings'
import { addMinutesToTime, formatTimeDisplay } from '../../../utils/time'
import { elapsedMsOf, formatStopwatch } from '../../../utils/timer'
import type { AgendaDayItem } from '../../../types/agenda'

interface TrailStepProps {
  item: AgendaDayItem
  /** horizontal anchor of the node, as a fraction of the container width */
  x: number
  /** node the user should tackle next */
  isNext: boolean
  onOpen: (item: AgendaDayItem) => void
  onComplete: (item: AgendaDayItem) => void
  /** starts/pauses the stopwatch of a 'timer' afazer */
  onToggleTimer: (item: AgendaDayItem) => void
}

function metaOf(item: AgendaDayItem, use12h: boolean): string {
  const start = formatTimeDisplay(item.time, use12h)
  if (item.durationMinutes) {
    const end = formatTimeDisplay(addMinutesToTime(item.time, item.durationMinutes), use12h)
    return `${start} → ${end}`
  }
  return start
}

function StopwatchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 2h6" />
      <circle cx="12" cy="14" r="8" />
      <path d="M12 14V9.5" />
      <path d="M19 6l1.6 1.6" />
    </svg>
  )
}

/** One circular stop of the journey plus its floating label. */
export function TrailStep({
  item,
  x,
  isNext,
  onOpen,
  onComplete,
  onToggleTimer,
}: TrailStepProps) {
  const { settings } = useSettings()
  const isTimer = item.kind === 'timer'
  const running = isTimer && !item.done && Boolean(item.timerStartedAt)
  // Only a running stopwatch pays the cost of re-rendering every second.
  const tick = useTicker(1000, running)
  const elapsed = elapsedMsOf(item, tick)

  const { progress, holding, holdProps } = useHoldToComplete({
    onComplete: () => onComplete(item),
    // A timer node starts/pauses; every other node (and a finished one) opens.
    onTap: () => (isTimer && !item.done ? onToggleTimer(item) : onOpen(item)),
  })

  const classNames = ['trail-node-row']
  if (item.done) classNames.push('is-done')
  if (isNext) classNames.push('is-next')
  if (holding) classNames.push('is-holding')
  if (isTimer) classNames.push('is-timer')
  if (running) classNames.push('is-running')

  const side = x > 0.5 ? 'is-left' : 'is-right'

  const ariaLabel = [
    item.title,
    metaOf(item, settings.timeFormat12h),
    item.done ? 'concluído' : 'pendente',
    isTimer ? 'cronômetro' : '',
    item.done
      ? 'segure para desfazer a conclusão'
      : isTimer
        ? 'toque para iniciar ou pausar o cronômetro, segure 3s para concluir'
        : 'toque para ver detalhes, segure 3s para concluir',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <li
      className={classNames.join(' ')}
      style={{ '--x': x, '--hold': progress } as CSSProperties}
    >
      <button type="button" className={`trail-bubble ${side}`} onClick={() => onOpen(item)}>
        <span className="trail-bubble-title">{item.title}</span>
        <span className="trail-bubble-meta">
          {metaOf(item, settings.timeFormat12h)}
          {item.category ? ` · ${item.category}` : ''}
          {item.alarmEnabled ? ' · lembrete' : ''}
          {isTimer && running ? ' · cronômetro rodando' : ''}
        </span>
        {isNext && !item.done && <span className="trail-bubble-flag">A seguir</span>}
      </button>

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
          ) : isTimer ? (
            elapsed > 0 ? (
              <span className="trail-timer-value">{formatStopwatch(elapsed)}</span>
            ) : (
              <StopwatchIcon />
            )
          ) : (
            <TaskIcon id={item.icon} size={26} />
          )}
        </span>
      </button>
    </li>
  )
}
