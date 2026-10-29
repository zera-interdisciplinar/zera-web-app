import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CarregandoPagina } from '../components/CarregandoPagina'
import { PrivateRoute } from '../components/PrivateRoute'
import { EstruturaPublica } from '../components/EstruturaPublica'

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('../features/dashboard/pages/OverviewPage'))
const ItemsPage = lazy(() => import('../features/items/pages/ItemsPage'))
const ItemDetailPage = lazy(() => import('../features/items/pages/ItemDetailPage'))
const ModelsPage = lazy(() => import('../features/models/pages/ModelsPage'))
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'))
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
          <Route path="/itens" element={<ItemsPage />} />
          <Route path="/itens/:id" element={<ItemDetailPage />} />
          <Route path="/modelos" element={<ModelsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
