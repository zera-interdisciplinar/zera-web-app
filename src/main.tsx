import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/sora/600.css'
import '@fontsource/sora/700.css'
import '@fontsource/sora/800.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/700.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/global.css'
import { App } from './App'

async function preparar() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
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
