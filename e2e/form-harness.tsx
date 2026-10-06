import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../src/context/auth'
import { AcessibilidadeProvider } from '../src/context/AcessibilidadeContext'
import FuncionariosPage from '../src/pages/FuncionariosPage'
import ConfiguracoesPage from '../src/pages/ConfiguracoesPage'
import RecicladorasPage from '../src/pages/RecicladorasPage'
import TriagemPage from '../src/pages/TriagemPage'
import LoginPage from '../src/pages/LoginPage'
import '../styles/global.css'

// Apenas entrada de testes do Vite: não é importada pelo aplicativo nem pelo build.
const componentes = { funcionarios: FuncionariosPage, configuracoes: ConfiguracoesPage, recicladora: RecicladorasPage, triagem: TriagemPage, login: LoginPage }
const nome = new URLSearchParams(location.search).get('form')
const Componente = nome === 'funcionarios' || nome === 'configuracoes' || nome === 'recicladora' || nome === 'triagem' ? componentes[nome] : LoginPage
const raiz = document.getElementById('root')
if (!raiz) throw new Error('Raiz de teste ausente.')
createRoot(raiz).render(<AcessibilidadeProvider><AuthContext.Provider value={{
  usuario: { id: '1', nome: 'Pessoa sintética', email: 'pessoa@example.invalid', perfil: 'administrador', unidade: 'unidade' },
  autenticado: nome !== 'login', entrando: false, erro: null,
  entrar: async () => 'falha', sair: () => {}, temPerfil: (perfis) => perfis.includes('administrador'),
}}><MemoryRouter initialEntries={['/itens/1/triagem']}><Routes><Route path="/itens/:id/triagem" element={nome === 'login' ? <Componente /> : <main id="conteudo"><Componente /></main>} /></Routes></MemoryRouter></AuthContext.Provider></AcessibilidadeProvider>)
