import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AccessibilityPanel } from './components/AccessibilityPanel'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { navigationItems } from './utils/navigation'
import { AppRoutes } from './routes/AppRoutes'
import { AvisoNavegacao } from './components/AvisoNavegacao'
import { LimiteErro } from './components/LimiteErro'
import { AppProviders } from './context/AppProviders'

const voiceRoutes = navigationItems.map((item) => ({ phrase: item.voice, path: item.path }))

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <ConteudoApp />
      </BrowserRouter>
    </AppProviders>
  )
}

function ConteudoApp() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <LimiteErro><AppRoutes /></LimiteErro>
        <AvisoNavegacao />
        <AccessibilityPanel routes={voiceRoutes} />
      </AuthProvider>
    </AccessibilityProvider>
  )
}
