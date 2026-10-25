import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AccessibilityPanel, AccessibilityProvider } from './shared/accessibility'
import { navigationItems } from './app/navigation'
import { AppRoutes } from './routes/AppRoutes'
import { AvisoNavegacao } from './components/AvisoNavegacao'
import { LimiteErro } from './components/LimiteErro'
import { AppProviders } from './app/providers'

const voiceRoutes = navigationItems.map((item) => ({ phrase: item.voice, path: item.path }))

export function App() {
  const Router = import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter
  return (
    <AppProviders>
      <Router>
        <ConteudoApp />
      </Router>
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
        <footer className="rodape-sistema">ZERA · Gestão de resíduos eletrônicos</footer>
      </AuthProvider>
    </AccessibilityProvider>
  )
}
