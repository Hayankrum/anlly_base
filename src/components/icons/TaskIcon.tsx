import type { ReactNode } from 'react'
import { normalizeIcon } from '../../utils/icons'

/**
 * Own line-style icon set: 24×24, 1.8px stroke, round joins, currentColor.
 * Every body is plain SVG so it inherits the color of its container.
 */
const ICON_BODIES: Record<string, ReactNode> = {
  pin: (
    <>
      <path d="M12 21v-7.5" />
      <path d="M7.5 3.5h9l-1.4 6.5a1 1 0 0 1-1 .8H9.9a1 1 0 0 1-1-.8z" />
      <path d="M6 3.5h12" />
    </>
  ),
  basket: (
    <>
      <path d="M4 9h16l-1.4 9.1A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.9z" />
      <path d="M8.6 9 11 4M15.4 9 13 4" />
      <path d="M9.6 12.5 10.5 17M14.4 12.5 13.5 17" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="10.5" rx="1.5" />
      <path d="M2.5 19h19" />
      <path d="M9.5 15.5v3.5M14.5 15.5v3.5" />
    </>
  ),
  books: (
    <>
      <path d="M4 6.5h4v13H4zM9 6.5h4v13H9z" />
      <path d="m14.4 8 3.6-.8 2.4 11.6-3.6.8z" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M3.5 9.5v5M6.5 7.5v9M17.5 7.5v9M20.5 9.5v5" />
      <path d="M6.5 12h11" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4.5h1.9a1 1 0 0 1 1 .8L7.4 13h9.9l1.9-6.6H6.1" />
      <circle cx="9.3" cy="18.4" r="1.7" />
      <circle cx="16.4" cy="18.4" r="1.7" />
    </>
  ),
  broom: (
    <>
      <path d="M19.5 4.5 12 11.8" />
      <path d="M11.4 11.2 4.8 15.6l1.6 4.4 4.4-1.6 4.4-4.4z" />
      <path d="M7.2 16.4 8.6 20M10.2 13.6l1.4 3.4" />
    </>
  ),
  file: (
    <>
      <path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
      <path d="M13.5 3.5v4a1 1 0 0 0 1 1h4" />
      <path d="M8.5 13.5h7M8.5 16.5h5" />
    </>
  ),
  bank: (
    <>
      <path d="m3.5 9.5 8.5-5.5 8.5 5.5" />
      <path d="M6 10.5v7M10 10.5v7M14 10.5v7M18 10.5v7" />
      <path d="M3.5 18.5h17M4.5 21h15" />
    </>
  ),
  pan: (
    <>
      <circle cx="10" cy="12.5" r="6.5" />
      <path d="M16.2 10.3 20.5 8" />
      <ellipse cx="10" cy="12.5" rx="2.6" ry="2.2" />
    </>
  ),
  bed: (
    <>
      <path d="M3 19.5V9" />
      <path d="M3 14.5h14.5a3.5 3.5 0 0 1 3.5 3.5v1.5" />
      <path d="M3 19.5h18" />
      <path d="M6 14.5V12h4.5v2.5" />
    </>
  ),
  book: (
    <>
      <path d="M12 7S10 5 4.5 5v13c5.5 0 7.5 2 7.5 2s2-2 7.5-2V5c-5.5 0-7.5 2-7.5 2z" />
      <path d="M12 7v13" />
    </>
  ),
  shower: (
    <>
      <path d="M4.5 4.5H10" />
      <path d="M10 4.5h4l2.5 6.5h-9z" />
      <path d="M9 14v1.6M12 15.5V17M15 14v1.6M10.5 18v1.6M13.5 18v1.6" />
    </>
  ),
  pill: (
    <g transform="rotate(-45 12 12)">
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" />
      <path d="M12 8.5v7" />
    </g>
  ),
  car: (
    <>
      <path d="M4.5 16v-3l1.9-4.5h11.2L19.5 13v3" />
      <path d="M4.5 13h15" />
      <path d="M7.5 8.5V13M16.5 8.5V13" />
      <circle cx="8.2" cy="17.6" r="1.7" />
      <circle cx="15.8" cy="17.6" r="1.7" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="12" cy="15.8" rx="4.3" ry="3.4" />
      <ellipse cx="6.4" cy="11.4" rx="1.8" ry="2.3" />
      <ellipse cx="17.6" cy="11.4" rx="1.8" ry="2.3" />
      <ellipse cx="9.9" cy="8.3" rx="1.8" ry="2.4" />
      <ellipse cx="14.1" cy="8.3" rx="1.8" ry="2.4" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-9.5" />
      <path d="M12 14.5c-4.2 0-6.8-2.1-6.8-6.2 4.2 0 6.8 2.1 6.8 6.2z" />
      <path d="M12 13.4c3.7 0 6.2-1.9 6.2-5.7-3.7 0-6.2 1.9-6.2 5.7z" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m12 8.2 3.6 2.6-1.4 4.2H9.8L8.4 10.8z" />
      <path d="M12 8.2V3.5M15.6 10.8l2.6-1.7M14.2 15l1.8 2.7M9.8 15 8 17.7M8.4 10.8 5.8 9.1" />
    </>
  ),
  gift: (
    <>
      <path d="M4.5 10.5h15v9.5h-15z" />
      <path d="M3 7.5h18v3H3z" />
      <path d="M12 7.5v12.5" />
      <path d="M12 7.5c0-2.5-1.6-4-3.1-3.3-1.5.7-1 3.3 3.1 3.3 4.1 0 4.6-2.6 3.1-3.3C13.6 3.5 12 5 12 7.5z" />
    </>
  ),
  brain: (
    <>
      <path d="M12 4.8v14.4" />
      <path d="M12 5.6a3 3 0 0 0-5.4 1.8 3.2 3.2 0 0 0-1.6 5.6A3 3 0 0 0 12 18.6" />
      <path d="M12 5.6a3 3 0 0 1 5.4 1.8 3.2 3.2 0 0 1 1.6 5.6A3 3 0 0 1 12 18.6" />
      <path d="M8.2 9.4c-.9.5-1.3 1.5-1 2.5M15.8 9.4c.9.5 1.3 1.5 1 2.5" />
    </>
  ),
  coffee: (
    <>
      <path d="M4.5 8h11.5v6a4.5 4.5 0 0 1-4.5 4.5H9A4.5 4.5 0 0 1 4.5 14z" />
      <path d="M16 9.6h1.4a2.4 2.4 0 0 1 0 4.8H16" />
      <path d="M8.4 5.6c.7-.8.7-1.5 0-2.3M11.6 5.6c.7-.8.7-1.5 0-2.3" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 11.5 10.2 5.5 19 5.5c0 8.6-5.9 13.5-13 13.5z" />
      <path d="M5 19c3.2-4.3 6.4-7 10.4-9.2" />
    </>
  ),
}

export interface TaskIconProps {
  id?: string | null
  size?: number
  className?: string
  strokeWidth?: number
}

/** Renders one task icon; unknown ids fall back to the default icon. */
export function TaskIcon({ id, size = 24, className, strokeWidth = 1.8 }: TaskIconProps) {
  const body = ICON_BODIES[normalizeIcon(id)]
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {body}
    </svg>
  )
}
