import type { ComponentType } from 'react'
import { HomePage } from './modules/home/HomePage'
import { DashboardPage } from './modules/dashboard/DashboardPage'
import { CalendarPage } from './modules/calendar/CalendarPage'
import { DetailPage } from './modules/detail/DetailPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { BottomNav } from './components/BottomNav/BottomNav'
import { CreateFab } from './components/Fab/CreateFab'
import { SettingsProvider } from './hooks/SettingsProvider'
import { JourneyProvider } from './hooks/JourneyProvider'
import { NavigationProvider } from './navigation/NavigationProvider'
import { useNavigation } from './navigation/useNavigation'
import type { AreaId } from './navigation/areas'
import './App.css'

/** One view per area — exhaustive by type. */
const AREA_VIEWS: Record<AreaId, ComponentType> = {
  home: HomePage,
  dashboard: DashboardPage,
  calendario: CalendarPage,
  detalhe: DetailPage,
  configuracoes: SettingsPage,
}

function ActiveArea() {
  const { active } = useNavigation()
  const View = AREA_VIEWS[active]
  return <View />
}

function App() {
  return (
    <SettingsProvider>
      <NavigationProvider>
        <JourneyProvider>
          <div className="app-viewport">
            <div className="content-panel">
              <ActiveArea />
              <CreateFab />
            </div>
            <BottomNav />
          </div>
        </JourneyProvider>
      </NavigationProvider>
    </SettingsProvider>
  )
}

export default App
