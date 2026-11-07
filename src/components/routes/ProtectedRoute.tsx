import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageSpinner } from '../ui/Spinner'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  // Todavía no sabemos si hay sesión: esperamos, no redirigimos
  if (status === 'loading') return <FullPageSpinner />

  if (status === 'unauthenticated') {
    // Guardamos a dónde quería ir, para volver ahí después del login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}