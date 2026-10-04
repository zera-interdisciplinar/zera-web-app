import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AcessibilidadeProvider } from './context/AcessibilidadeContext'
import { BarraAcessibilidade } from './components/BarraAcessibilidade'
import { AppRoutes } from './routes/AppRoutes'
import { AvisoNavegacao } from './components/AvisoNavegacao'

export function App() {
  const Router = import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter
  return (
    <Router>
      <AcessibilidadeProvider>
        <AuthProvider>
          <AppRoutes />
          <AvisoNavegacao />
          <BarraAcessibilidade />
        </AuthProvider>
      </AcessibilidadeProvider>
    </Router>
  )
}
