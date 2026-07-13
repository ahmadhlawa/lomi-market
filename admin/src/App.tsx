import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'

import { AuthProvider, RequireAuth, useAuth } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { Shell } from './components/Shell'
import { Loading } from './components/ui'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })))
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((module) => ({ default: module.OrdersPage })))
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((module) => ({ default: module.CustomersPage })))
const PromotionsPage = lazy(() => import('./pages/PromotionsPage').then((module) => ({ default: module.PromotionsPage })))
const DeliveryPage = lazy(() => import('./pages/DeliveryPage').then((module) => ({ default: module.DeliveryPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const SecurityPage = lazy(() => import('./pages/SecurityPage').then((module) => ({ default: module.SecurityPage })))

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

function LoginRoute() {
  const auth = useAuth()
  return auth.authenticated ? <Navigate to="/" replace /> : <LoginPage />
}

export function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><Suspense fallback={<Loading label="Loading workspace" />}><Routes>
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/" element={<RequireAuth><Shell /></RequireAuth>}>
      <Route index element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="promotions" element={<PromotionsPage />} />
      <Route path="delivery" element={<DeliveryPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="security" element={<SecurityPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AuthProvider></QueryClientProvider>
}
