import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../src/context/auth'
import { AccessibilityProvider } from '../src/shared/accessibility'
import LoginPage from '../src/features/auth/pages/LoginPage'
import '../styles/global.css'

// Apenas entrada de testes do Vite: não é importada pelo aplicativo nem pelo build.
const raiz = document.getElementById('root')
if (!raiz) throw new Error('Raiz de teste ausente.')
createRoot(raiz).render(<AccessibilityProvider><AuthContext.Provider value={{
  usuario: null, autenticado: false, restaurando: false,
  sair: async () => undefined, temPerfil: () => false,
}}><MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /></Routes></MemoryRouter></AuthContext.Provider></AccessibilityProvider>)
