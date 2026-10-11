import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-500.css'
import '@fontsource/public-sans/latin-700.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '../styles/global.css'
import { App } from './App'

function preparar() {
  const raiz = document.getElementById('root')
  if (!raiz) throw new Error('Elemento #root não encontrado.')

  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

if (import.meta.env.DEV && import.meta.env.MODE === 'test' && import.meta.env.VITE_USE_MSW === 'true') {
  void import('./mocks/browser').then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' })).then(preparar)
} else preparar()
