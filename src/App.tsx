import type { ComponentType } from 'react'
import { AgendaPage } from './modules/agenda/AgendaPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { BottomNav } from './components/BottomNav/BottomNav'
import { SettingsProvider } from './hooks/SettingsProvider'
import { NavigationProvider } from './navigation/NavigationProvider'
import { useNavigation } from './navigation/useNavigation'
import type { AreaId } from './navigation/areas'
import './App.css'

/** One view per area — exhaustive by type. */
const AREA_VIEWS: Record<AreaId, ComponentType> = {
  agenda: AgendaPage,
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
        <div className="app-viewport">
          <ActiveArea />
          <BottomNav />
        </div>
      </NavigationProvider>
    </SettingsProvider>
  )
}

export default App
