import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-500.css'
import '@fontsource/public-sans/latin-700.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '../styles/global.css'
import { App } from './App'

async function preparar() {
  if (import.meta.env.VITE_USE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true, serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` } })
  }

  const raiz = document.getElementById('root')
  if (!raiz) throw new Error('Elemento #root não encontrado.')

  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void preparar()
