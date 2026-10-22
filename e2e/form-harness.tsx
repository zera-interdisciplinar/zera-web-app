import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../src/context/auth'
import { AcessibilidadeProvider } from '../src/context/AcessibilidadeContext'
import LoginPage from '../src/pages/LoginPage'
import '../styles/global.css'

// Apenas entrada de testes do Vite: não é importada pelo aplicativo nem pelo build.
const raiz = document.getElementById('root')
if (!raiz) throw new Error('Raiz de teste ausente.')
createRoot(raiz).render(<AcessibilidadeProvider><AuthContext.Provider value={{
  usuario: null, autenticado: false, entrando: false, erro: null,
  entrar: async () => 'falha', sair: () => {}, temPerfil: () => false,
}}><MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /></Routes></MemoryRouter></AuthContext.Provider></AcessibilidadeProvider>)
