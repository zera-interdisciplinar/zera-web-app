import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-500.css'
import '@fontsource/public-sans/latin-700.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '../styles/global.css'
import { App } from './App'
import { sessionManager } from './shared/auth'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Elemento #root não encontrado.')

// Restaura a sessão da aba (refresh token) em paralelo; as rotas privadas esperam o resultado.
void sessionManager.restore()

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
