import type { ReactElement } from 'react'

/** Conceptual areas of Anlly. `detalhe` is only reachable from Home/Calendário. */
export type AreaId = 'home' | 'dashboard' | 'calendario' | 'detalhe' | 'configuracoes'

/** Entries of the bottom navigation, in display order. */
export type NavId = 'home' | 'dashboard' | 'calendario' | 'configuracoes'

export interface NavEntry {
  id: NavId
  label: string
  icon: ReactElement
}

/** Casa com cantos arredondados e porta recortada (evenodd). */
const homeIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M11.1 3.66a1.5 1.5 0 0 1 1.8 0l6.7 5.24c.46.36.72.9.72 1.48V18.4A2.6 2.6 0 0 1 17.72 21H6.28A2.6 2.6 0 0 1 3.7 18.4v-8.02c0-.58.26-1.12.72-1.48l6.68-5.24ZM10 21v-5a2 2 0 0 1 4 0v5h-4Z"
    />
  </svg>
)

const dashboardIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      fill="currentColor"
      d="M4 13h4v7H4v-7Zm6-6h4v13h-4V7Zm6 3h4v10h-4V10ZM3 5v16h18V5H3Zm2 2h14v12H5V7Z"
    />
  </svg>
)

/** Filled calendar: body with four day cells and two tabs (evenodd punches the holes). */
const calendarIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M5 6h14a1.6 1.6 0 0 1 1.6 1.6v10.8A1.6 1.6 0 0 1 19 20H5a1.6 1.6 0 0 1-1.6-1.6V7.6A1.6 1.6 0 0 1 5 6ZM6.4 2h1.7v3.8H6.4zM15.9 2h1.7v3.8h-1.7zM7.4 10.4h3.1v2.5H7.4zM13.5 10.4h3.1v2.5h-3.1zM7.4 14.4h3.1v2.5H7.4zM13.5 14.4h3.1v2.5h-3.1z"
    />
  </svg>
)

const settingsIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      fill="currentColor"
      d="m12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9.4 4a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L16.5 3h-4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z"
    />
  </svg>
)

export const NAV_ENTRIES: readonly NavEntry[] = [
  { id: 'home', label: 'Home', icon: homeIcon },
  { id: 'calendario', label: 'Calendário', icon: calendarIcon },
  { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
  { id: 'configuracoes', label: 'Configurações', icon: settingsIcon },
]
