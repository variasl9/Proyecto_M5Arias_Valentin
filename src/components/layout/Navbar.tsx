import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

function linkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
  }`
}

export function Navbar() {
  const { status, profile, isAdmin, logout } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="text-lg font-bold text-indigo-600">
          Patagonix Store
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Catálogo
          </NavLink>

          {status === 'authenticated' && (
            <NavLink to="/orders" className={linkClass}>
              Mis órdenes
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}

          {status === 'authenticated' && (
            <>
              <span className="hidden px-2 text-sm text-gray-500 sm:inline">
                Hola, {profile?.displayName ?? profile?.email}
              </span>
              <Button variant="ghost" onClick={() => void logout()}>
                Salir
              </Button>
            </>
          )}

          {status === 'unauthenticated' && (
            <NavLink to="/login" className={linkClass}>
              Ingresar
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}