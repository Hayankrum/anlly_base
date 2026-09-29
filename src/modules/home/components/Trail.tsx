import { TrailStep } from './TrailStep'
import type { AgendaDayItem } from '../../../types/agenda'

/** Vertical distance between two nodes of the path. */
const ROW_HEIGHT = 104
/** Horizontal anchor of each node, as a fraction of the container width. */
const COLUMNS = [0.5, 0.24, 0.5, 0.76]

interface TrailProps {
  items: AgendaDayItem[]
  onOpen: (item: AgendaDayItem) => void
  onComplete: (item: AgendaDayItem) => void
  onToggleTimer: (item: AgendaDayItem) => void
}

interface Point {
  x: number
  y: number
}

/** Smooth S-curves between anchors, so the road winds like a map trail. */
function buildPath(points: Point[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]
    const to = points[i]
    const dy = (to.y - from.y) * 0.55
    d += ` C ${from.x} ${from.y + dy}, ${to.x} ${to.y - dy}, ${to.x} ${to.y}`
  }
  return d
}

/**
 * Duolingo-style journey: circular nodes hanging from a winding road that
 * fills in up to the point the user has reached, ending on a goal marker.
 */
export function Trail({ items, onOpen, onComplete, onToggleTimer }: TrailProps) {
  const firstPending = items.findIndex((item) => !item.done)

  const anchors: Point[] = items.map((_, index) => ({
    x: COLUMNS[index % COLUMNS.length] * 100,
    y: index * ROW_HEIGHT + ROW_HEIGHT / 2,
  }))
  const goal: Point = { x: 50, y: items.length * ROW_HEIGHT + ROW_HEIGHT / 2 }
  const points = [...anchors, goal]

  const road = buildPath(points)
  const reachedIndex = firstPending === -1 ? points.length - 1 : firstPending
  const traveled = buildPath(points.slice(0, reachedIndex + 1))

  return (
    <div className="trail-wrap">
      <svg
        className="trail-road"
        viewBox={`0 0 100 ${points.length * ROW_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="trail-road-base" d={road} vectorEffect="non-scaling-stroke" />
        <path className="trail-road-done" d={traveled} vectorEffect="non-scaling-stroke" />
      </svg>

      <ol
        className="trail-path"
        aria-label="trilha de hoje"
        style={{ '--row': `${ROW_HEIGHT}px` } as React.CSSProperties}
      >
        {items.map((item, index) => (
          <TrailStep
            key={item.id}
            item={item}
            x={COLUMNS[index % COLUMNS.length]}
            isNext={index === firstPending}
            onOpen={onOpen}
            onComplete={onComplete}
            onToggleTimer={onToggleTimer}
          />
        ))}
        <TrailGoal reached={firstPending === -1} />
      </ol>
    </div>
  )
}

function TrailGoal({ reached }: { reached: boolean }) {
  return (
    <li
      className={`trail-node-row trail-goal${reached ? ' is-reached' : ''}`}
      style={{ '--x': 0.5 } as React.CSSProperties}
    >
      <span className="trail-bubble is-right">
        <span className="trail-bubble-title">
          {reached ? 'Jornada concluída!' : 'Chegada'}
        </span>
        <span className="trail-bubble-meta">
          {reached ? 'Você percorreu o caminho de hoje' : 'Complete todos os passos'}
        </span>
      </span>
      <span className="trail-hit is-static" aria-hidden="true">
        <span className="trail-node is-goal">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5.5 21V4.2" />
            <path d="M5.5 4.8h11l-1.8 3.4 1.8 3.4h-11" />
          </svg>
        </span>
      </span>
    </li>
  )
}
