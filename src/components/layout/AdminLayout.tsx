import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Resumen', end: true },
  { to: '/admin/products', label: 'Productos', end: false },
  { to: '/admin/orders', label: 'Órdenes', end: false },
]

function linkClass({ isActive }: { isActive: boolean }) {
  return `shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`
}

export function AdminLayout() {
  const { profile, logout } = useAuth()

  return (
    <div className="flex min-h-svh flex-col bg-slate-100 lg:flex-row">
      <aside className="bg-slate-900 text-slate-100 lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="px-4 py-3 lg:py-6">
          <Link to="/admin" className="text-lg font-bold">
            Patagonix <span className="text-indigo-400">Admin</span>
          </Link>
          <p className="hidden truncate text-xs text-slate-400 lg:block">{profile?.email}</p>
        </div>

        {/* Celular: fila deslizable. Escritorio: columna vertical */}
        <nav
          aria-label="Navegación del panel"
          className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:px-3"
        >
          {ADMIN_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}

          <div className="ml-auto flex gap-1 lg:ml-0 lg:mt-auto lg:flex-col lg:border-t lg:border-slate-800 lg:pt-3">
            <Link to="/" className={linkClass({ isActive: false })}>
              Ver tienda
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className={`${linkClass({ isActive: false })} text-left`}
            >
              Salir
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}