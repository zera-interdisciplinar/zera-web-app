import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CarregandoPagina } from '../components/CarregandoPagina'
import { PrivateRoute } from '../components/PrivateRoute'
import { EstruturaPublica } from '../components/EstruturaPublica'

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const ItensPage = lazy(() => import('../pages/ItensPage'))
const ItemDetalhePage = lazy(() => import('../pages/ItemDetalhePage'))
const ModelosPage = lazy(() => import('../pages/ModelosPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export function AppRoutes() {
  return (
    <Suspense fallback={<CarregandoPagina />}>
      <Routes>
        <Route element={<EstruturaPublica />}>
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/modelos" element={<ModelosPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
