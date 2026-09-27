import type { ReactNode } from 'react'

export interface StatTileProps {
  label: string
  value: ReactNode
  sub?: string
  tone?: 'accent' | 'done' | 'gold'
  icon?: ReactNode
}

/** One KPI tile of the dashboard header row. */
export function StatTile({ label, value, sub, tone = 'accent', icon }: StatTileProps) {
  return (
    <div className="stat-tile" data-tone={tone}>
      {icon && <span className="stat-tile-icon">{icon}</span>}
      <span className="stat-tile-value">{value}</span>
      <span className="stat-tile-label">{label}</span>
      {sub && <span className="stat-tile-sub">{sub}</span>}
    </div>
  )
}
