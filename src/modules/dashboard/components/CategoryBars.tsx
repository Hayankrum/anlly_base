export interface CategoryStat {
  name: string
  total: number
  done: number
}

/** Horizontal bars: share of the month per category. */
export function CategoryBars({ rows }: { rows: CategoryStat[] }) {
  if (rows.length === 0) {
    return <p className="chart-empty">Nenhum afazer neste mês.</p>
  }
  const peak = Math.max(...rows.map((row) => row.total))

  return (
    <ul className="category-bars">
      {rows.map((row) => (
        <li key={row.name} className="category-bar-row">
          <span className="category-bar-name">{row.name}</span>
          <span className="category-bar-track">
            <span className="category-bar-total" style={{ width: `${(row.total / peak) * 100}%` }}>
              <span className="category-bar-done" style={{ width: `${(row.done / row.total) * 100}%` }} />
            </span>
          </span>
          <span className="category-bar-count">
            {row.done}/{row.total}
          </span>
        </li>
      ))}
    </ul>
  )
}
