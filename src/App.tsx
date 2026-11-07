import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { MainLayout } from './components/layout/MainLayout'
import { AdminRoute } from './components/routes/AdminRoute'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      {/* ===== Tienda (layout del cliente) ===== */}
      <Route element={<MainLayout />}>
        {/* Públicas */}
        <Route index element={<HomePage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Requieren sesión */}
        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* ===== Panel de administración (layout propio) ===== */}
      <Route path="admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App