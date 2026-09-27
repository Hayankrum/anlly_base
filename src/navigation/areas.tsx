import type { ReactElement } from 'react'

/** Conceptual areas of Anlly. Order defines the bottom navigation order. */
export type AreaId = 'agenda' | 'configuracoes'

export interface Area {
  id: AreaId
  label: string
  icon: ReactElement
}

export const AREAS: readonly Area[] = [
  {
    id: 'agenda',
    label: 'Agenda',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8v10H5V10h14Z"
        />
      </svg>
    ),
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          fill="currentColor"
          d="m12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9.4 4a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L16.5 3h-4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z"
        />
      </svg>
    ),
  },
]

export const AREA_BY_ID = Object.fromEntries(AREAS.map((area) => [area.id, area])) as Record<
  AreaId,
  Area
>
