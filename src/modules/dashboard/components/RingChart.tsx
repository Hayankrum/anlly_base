interface RingChartProps {
  percent: number
  size?: number
  stroke?: number
  tone?: 'accent' | 'done' | 'gold'
}

/** Donut progress indicator drawn with a single dashed circle. */
export function RingChart({ percent, size = 74, stroke = 8, tone = 'accent' }: RingChartProps) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <svg
      className={`ring-chart is-${tone}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${safe}%`}
    >
      <circle
        className="ring-chart-track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
      />
      <circle
        className="ring-chart-fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(circumference * safe) / 100} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
