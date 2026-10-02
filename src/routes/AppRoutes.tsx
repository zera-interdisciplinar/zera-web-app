import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PrivateRoute } from '../components/PrivateRoute'
import { Skeleton } from '../components/Skeleton'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const ItensPage = lazy(() => import('../pages/ItensPage'))
const ItemDetalhePage = lazy(() => import('../pages/ItemDetalhePage'))
const TriagemPage = lazy(() => import('../pages/TriagemPage'))
const ModelosPage = lazy(() => import('../pages/ModelosPage'))
const RecicladorasPage = lazy(() => import('../pages/RecicladorasPage'))
const FuncionariosPage = lazy(() => import('../pages/FuncionariosPage'))
const RelatoriosPage = lazy(() => import('../pages/RelatoriosPage'))
const ConfiguracoesPage = lazy(() => import('../pages/ConfiguracoesPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const DescartesPage = lazy(() => import('../pages/DescartesPage'))

function CarregandoPagina() {
  return (
    <div style={{ padding: 'var(--sp-8)' }}>
      <Skeleton descricao="Carregando a página." linhas={3} />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<CarregandoPagina />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/itens" element={<ItensPage />} />
          <Route path="/itens/:id" element={<ItemDetalhePage />} />
          <Route path="/itens/:id/triagem" element={<PrivateRoute perfis={['funcionario', 'administrador']}><TriagemPage /></PrivateRoute>} />
          <Route path="/modelos" element={<ModelosPage />} />
          <Route path="/recicladoras" element={<RecicladorasPage />} />
          <Route path="/descartes" element={<PrivateRoute perfis={['gestor', 'administrador']}><DescartesPage /></PrivateRoute>} />
          <Route
            path="/funcionarios"
            element={
              <PrivateRoute perfis={['administrador']}>
                <FuncionariosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PrivateRoute perfis={['administrador']}>
                <RelatoriosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <PrivateRoute perfis={['administrador']}>
                <ConfiguracoesPage />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
