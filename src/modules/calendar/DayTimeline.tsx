import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { TaskIcon } from '../../components/icons/TaskIcon'
import { addMinutesToTime, formatTimeDisplay, isValidTime } from '../../utils/time'
import { todayStr } from '../../utils/dates'
import type { AgendaDayItem } from '../../types/agenda'

/** Pixels por hora — dá folga vertical para os marcadores não ficarem colados. */
const HOUR_HEIGHT = 64
/** Altura mínima de um bloco — um compromisso curto ainda ocupa essa faixa. */
const MIN_BLOCK_PX = 32
/** A mesma altura mínima em minutos, usada para detectar colisões reais. */
const MIN_BLOCK_MINUTES = Math.ceil((MIN_BLOCK_PX / HOUR_HEIGHT) * 60)
/** Folga vertical entre dois blocos — evita que os afazeres fiquem colados. */
const BLOCK_GAP = 4

interface DayTimelineProps {
  date: string
  items: AgendaDayItem[]
  onOpenItem: (item: AgendaDayItem) => void
}

function hourOf(time: string): number | null {
  if (!isValidTime(time)) return null
  return Number(time.slice(0, 2))
}

interface Span {
  item: AgendaDayItem
  startMin: number
  duration: number
  /** fim da área visual (com a altura mínima), usado só para achar sobreposição */
  overlapEnd: number
}

interface PlacedEvent {
  item: AgendaDayItem
  top: number
  height: number
  /** coluna dentro do grupo que se sobrepõe (0 = primeira) */
  col: number
  /** total de colunas do grupo */
  cols: number
}

/**
 * Groups overlapping events into clusters and hands each one a column, so
 * concurrent commitments sit side by side instead of stacked on each other.
 */
function layoutColumns(items: AgendaDayItem[]): { span: Span; col: number; cols: number }[] {
  const spans: Span[] = items
    .map((item) => {
      const startMin = (hourOf(item.time) ?? 0) * 60 + Number(item.time.slice(3, 5) || 0)
      const duration = item.durationMinutes ?? 30
      return {
        item,
        startMin,
        duration,
        overlapEnd: Math.max(startMin + duration, startMin + MIN_BLOCK_MINUTES),
      }
    })
    .sort((a, b) => a.startMin - b.startMin || a.overlapEnd - b.overlapEnd)

  const out: { span: Span; col: number; cols: number }[] = []
  let cluster: Span[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (cluster.length === 0) return
    const colEnds: number[] = []
    const assigned = cluster.map((span) => {
      let col = colEnds.findIndex((end) => end <= span.startMin)
      if (col === -1) col = colEnds.length
      colEnds[col] = span.overlapEnd
      return { span, col }
    })
    for (const entry of assigned) out.push({ ...entry, cols: colEnds.length })
    cluster = []
    clusterEnd = -Infinity
  }

  for (const span of spans) {
    if (cluster.length > 0 && span.startMin >= clusterEnd) flush()
    cluster.push(span)
    clusterEnd = Math.max(clusterEnd, span.overlapEnd)
  }
  flush()

  return out
}

/** Hour-by-hour map of the selected day: the schedule, not a list. */
export function DayTimeline({ date, items, onOpenItem }: DayTimelineProps) {
  const { settings } = useSettings()
  const today = todayStr()

  const windowHours = useMemo(() => {
    let start = 24
    let end = -1
    for (const item of items) {
      const hour = hourOf(item.time)
      if (hour === null) continue
      start = Math.min(start, hour)
      const span = item.durationMinutes ? Math.ceil((hour * 60 + Number(item.time.slice(3, 5)) + item.durationMinutes) / 60) : hour + 1
      end = Math.max(end, span)
    }
    if (start > end) {
      if (date === today) {
        const now = new Date().getHours()
        start = Math.max(0, now - 1)
        end = Math.min(23, now + 4)
      } else {
        start = 7
        end = 20
      }
    }
    start = Math.max(0, start - 1)
    end = Math.min(23, Math.max(end, start + 3))
    const hours: number[] = []
    for (let hour = start; hour <= end; hour++) hours.push(hour)
    return { start, hours }
  }, [items, date, today])

  const trackHeight = windowHours.hours.length * HOUR_HEIGHT
  const windowStartMin = windowHours.start * 60

  const placed = useMemo<PlacedEvent[]>(() => {
    const windowEndMin = windowStartMin + trackHeight * (60 / HOUR_HEIGHT)
    const list = layoutColumns(items).map(({ span, col, cols }) => {
      const clippedStart = Math.max(span.startMin, windowStartMin)
      const clippedEnd = Math.min(span.startMin + span.duration, windowEndMin)
      const top = ((clippedStart - windowStartMin) / 60) * HOUR_HEIGHT
      const height = Math.max(
        ((Math.max(clippedEnd, clippedStart + 15) - clippedStart) / 60) * HOUR_HEIGHT,
        MIN_BLOCK_PX,
      )
      return { item: span.item, top, height, col, cols }
    })

    // Nunca deixa um bloco invadir o próximo da mesma coluna e sempre reserva
    // uma folga vertical, para os afazeres não ficarem grudados uns nos outros.
    list.sort((a, b) => a.col - b.col || a.top - b.top)
    for (let i = 0; i < list.length; i++) {
      const current = list[i]
      const next = list[i + 1]
      if (next && next.col === current.col && next.top > current.top) {
        current.height = Math.min(current.height, next.top - current.top)
      }
      current.height = Math.max(current.height - BLOCK_GAP, 20)
    }
    return list
  }, [items, windowStartMin, trackHeight])

  const now = new Date()
  const nowTop =
    date === today ? ((now.getHours() * 60 + now.getMinutes() - windowStartMin) / 60) * HOUR_HEIGHT : null

  const viewportRef = useRef<HTMLDivElement>(null)
  const scrolledDateRef = useRef<string | null>(null)

  // Ao abrir um dia, a área começa na hora atual em vez do topo da janela.
  useEffect(() => {
    const el = viewportRef.current
    if (!el || scrolledDateRef.current === date) return
    scrolledDateRef.current = date
    const target = nowTop === null ? 0 : nowTop - el.clientHeight * 0.4
    el.scrollTop = Math.max(0, Math.min(target, el.scrollHeight - el.clientHeight))
  }, [date, nowTop])

  return (
    <div className="day-timeline">
      <div className="timeline-viewport" ref={viewportRef}>
        <div className="timeline-scroll" style={{ height: trackHeight }}>
          <div className="timeline-gutter">
            {windowHours.hours.map((hour, index) => (
              <span key={hour} className="timeline-hour" style={{ top: index * HOUR_HEIGHT }}>
                {formatTimeDisplay(`${String(hour).padStart(2, '0')}:00`, settings.timeFormat12h)}
              </span>
            ))}
          </div>

          <div className="timeline-track">
            {windowHours.hours.map((hour, index) => (
              <span
                key={hour}
                className="timeline-rule"
                style={{ top: index * HOUR_HEIGHT }}
                aria-hidden="true"
              />
            ))}

            {nowTop !== null && nowTop >= 0 && nowTop <= trackHeight && (
              <span className="timeline-now" style={{ top: nowTop }} aria-hidden="true">
                <span className="timeline-now-dot" />
              </span>
            )}

            {placed.map(({ item, top, height, col, cols }) => {
              const style = {
                top,
                height,
                '--event-color': item.color,
                '--col': String(col),
                '--cols': String(cols),
                '--gap': cols > 1 ? '8px' : '0px',
              } as CSSProperties
              const classNames = ['timeline-event']
              if (item.done) classNames.push('is-done')
              if (cols > 1) classNames.push('is-split')
              if (cols >= 3) classNames.push('is-narrow')

              return (
                <button
                  key={item.id}
                  type="button"
                  className={classNames.join(' ')}
                  style={style}
                  onClick={() => onOpenItem(item)}
                  aria-label={`${item.title}, ${formatTimeDisplay(item.time, settings.timeFormat12h)}${item.done ? ', concluído' : ''}`}
                >
                  <span className="timeline-event-icon">
                    <TaskIcon id={item.icon} size={15} />
                  </span>
                  <span className="timeline-event-body">
                    <span className="timeline-event-title">{item.title}</span>
                    <span className="timeline-event-time">
                      {formatTimeDisplay(item.time, settings.timeFormat12h)}
                      {item.durationMinutes
                        ? ` → ${formatTimeDisplay(
                            addMinutesToTime(item.time, item.durationMinutes),
                            settings.timeFormat12h,
                          )}`
                        : ''}
                    </span>
                  </span>
                </button>
              )
            })}

            {items.length === 0 && (
              <p className="timeline-empty">Nenhum afazer nesta data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
