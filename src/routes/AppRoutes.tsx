import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CarregandoPagina } from '../components/CarregandoPagina'
import { PrivateRoute } from '../components/PrivateRoute'
import { EstruturaPublica } from '../components/EstruturaPublica'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const RecuperarSenhaPage = lazy(() => import('../pages/RecuperarSenhaPage'))
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

export function AppRoutes() {
  return (
    <Suspense fallback={<CarregandoPagina />}>
      <Routes>
        <Route element={<EstruturaPublica />}>
          <Route path="/login" element={<LoginPage />} />
          {import.meta.env.DEV && <Route path="/demonstracao" element={<DashboardPage demonstracao />} />}
          <Route path="/esqueci-senha" element={<RecuperarSenhaPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
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
          <Route path="/itens/:id/triagem" element={<PrivateRoute permissao="realizarTriagem"><TriagemPage /></PrivateRoute>} />
          <Route path="/modelos" element={<ModelosPage />} />
          <Route path="/recicladoras" element={<RecicladorasPage />} />
          <Route path="/descartes" element={<PrivateRoute permissao="consultarDescartes"><DescartesPage /></PrivateRoute>} />
          <Route
            path="/funcionarios"
            element={
              <PrivateRoute permissao="consultarUsuarios">
                <FuncionariosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PrivateRoute permissao="consultarRelatorios">
                <RelatoriosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <PrivateRoute permissao="consultarConfiguracoes">
                <ConfiguracoesPage />
              </PrivateRoute>
            }
          />
        </Route>

      </Routes>
    </Suspense>
  )
}
