import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AcessibilidadeProvider } from './context/AcessibilidadeContext'
import { BarraAcessibilidade } from './components/BarraAcessibilidade'
import { AppRoutes } from './routes/AppRoutes'

export function App() {
  return (
    <BrowserRouter>
      <AcessibilidadeProvider>
        <AuthProvider>
          <AppRoutes />
          <BarraAcessibilidade />
        </AuthProvider>
      </AcessibilidadeProvider>
    </BrowserRouter>
  )
}
