import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageSpinner } from '../ui/Spinner'

export function AdminRoute() {
  const { status, isAdmin } = useAuth()
  const location = useLocation()

  // Clave: mientras el rol carga, NO decidimos. Si no, un admin sería expulsado.
  if (status === 'loading') return <FullPageSpinner />

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Tiene sesión pero no es admin: lo mandamos al catálogo
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}