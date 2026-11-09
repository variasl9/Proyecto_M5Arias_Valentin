import { screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { AuthContextValue } from '../../contexts/AuthContext'
import {
  adminProfile,
  authenticatedAs,
  createAuthValue,
  customerProfile,
  renderWithProviders,
} from '../../test/test-utils'
import { AdminRoute } from './AdminRoute'
import { ProtectedRoute } from './ProtectedRoute'

/** Página de login de prueba: muestra desde dónde nos redirigieron */
function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  return <p>Pantalla de login (venía de {from ?? 'ningún lado'})</p>
}

function renderRoutes(route: string, auth: AuthContextValue) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<p>Catálogo</p>} />
      <Route path="/login" element={<LoginProbe />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/orders" element={<p>Mis órdenes</p>} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<p>Panel admin</p>} />
      </Route>
    </Routes>,
    { route, auth },
  )
}

const loading = createAuthValue({ status: 'loading' })
const guest = createAuthValue({ status: 'unauthenticated' })

describe('ProtectedRoute', () => {
  it('mientras carga la sesión muestra un spinner y NO redirige', () => {
    renderRoutes('/orders', loading)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText(/pantalla de login/i)).not.toBeInTheDocument()
  })

  it('sin sesión redirige al login recordando a dónde quería ir', () => {
    renderRoutes('/orders', guest)
    expect(screen.getByText('Pantalla de login (venía de /orders)')).toBeInTheDocument()
  })

  it('con sesión muestra el contenido', async () => {
    renderRoutes('/orders', authenticatedAs(customerProfile))
    // findBy espera a que se asiente todo (incluida la carga del carrito en la nube)
    expect(await screen.findByText('Mis órdenes')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  it('mientras carga el rol muestra un spinner y no expulsa a nadie', () => {
    renderRoutes('/admin', loading)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument()
    expect(screen.queryByText('Catálogo')).not.toBeInTheDocument()
    expect(screen.queryByText(/pantalla de login/i)).not.toBeInTheDocument()
  })

  it('sin sesión redirige al login', () => {
    renderRoutes('/admin', guest)
    expect(screen.getByText('Pantalla de login (venía de /admin)')).toBeInTheDocument()
  })

  it('un customer es enviado al catálogo', async () => {
    renderRoutes('/admin', authenticatedAs(customerProfile))
    expect(await screen.findByText('Catálogo')).toBeInTheDocument()
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument()
  })

  it('un admin ve el panel', async () => {
    renderRoutes('/admin', authenticatedAs(adminProfile))
    expect(await screen.findByText('Panel admin')).toBeInTheDocument()
  })
})