import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Skeleton } from '../components/Skeleton'
import { PrivateRoute } from '../components/PrivateRoute'
import { EstruturaPublica } from '../components/EstruturaPublica'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const DashboardPage = lazy(() => import('../pages/OverviewPage'))
const ItemsPage = lazy(() => import('../pages/ItemsPage'))
const ItemDetailPage = lazy(() => import('../pages/ItemDetailPage'))
const ModelsPage = lazy(() => import('../pages/ModelsPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export function AppRoutes() {
  return (
    <Routes>
        <Route element={<EstruturaPublica />}>
          <Route path="/login" element={<Suspense key="LoginPage" fallback={<main id="conteudo" tabIndex={-1} data-carregando><Skeleton descricao="Carregando a página." linhas={3} /></main>}><LoginPage /></Suspense>} />
          <Route path="*" element={<Suspense key="NotFoundPage" fallback={<main id="conteudo" tabIndex={-1} data-carregando><Skeleton descricao="Carregando a página." linhas={3} /></main>}><NotFoundPage /></Suspense>} />
        </Route>
        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Suspense key="DashboardPage" fallback={<Skeleton descricao="Carregando a página." linhas={3} />}><DashboardPage /></Suspense>} />
          <Route path="/itens" element={<Suspense key="ItemsPage" fallback={<Skeleton descricao="Carregando a página." linhas={3} />}><ItemsPage /></Suspense>} />
          <Route path="/itens/:id" element={<Suspense key="ItemDetailPage" fallback={<Skeleton descricao="Carregando a página." linhas={3} />}><ItemDetailPage /></Suspense>} />
          <Route path="/modelos" element={<Suspense key="ModelsPage" fallback={<Skeleton descricao="Carregando a página." linhas={3} />}><ModelsPage /></Suspense>} />
          <Route path="/configuracoes" element={<Navigate to="/itens" replace />} />
        </Route>
    </Routes>
  )
}
