/* eslint-disable react-refresh/only-export-components */
import { render, type RenderOptions } from '@testing-library/react'
import type { Timestamp } from 'firebase/firestore'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartProvider'
import type { UserProfile } from '../types'

/* ---------- Usuarios de prueba ---------- */

export const customerProfile: UserProfile = {
  uid: 'user-1',
  email: 'cliente@test.com',
  displayName: 'Cliente Test',
  role: 'customer',
  createdAt: {} as Timestamp,
}

export const adminProfile: UserProfile = {
  uid: 'admin-1',
  email: 'admin@test.com',
  displayName: 'Admin Test',
  role: 'admin',
  createdAt: {} as Timestamp,
}

/* ---------- Estado de sesión falso ---------- */

/** Arma un valor de AuthContext a medida, sin pasar por Firebase */
export function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'unauthenticated',
    profile: null,
    error: null,
    isAdmin: false,
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

export function authenticatedAs(profile: UserProfile): AuthContextValue {
  return createAuthValue({
    status: 'authenticated',
    profile,
    isAdmin: profile.role === 'admin',
  })
}

/* ---------- Wrapper de providers ---------- */

interface ProvidersOptions {
  auth?: AuthContextValue
  route?: string
}

/** Todos los providers de la app, listos para usar en tests */
export function AllProviders({
  children,
  auth = createAuthValue(),
  route = '/',
}: ProvidersOptions & { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={auth}>
        <CartProvider>{children}</CartProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

/** Como render() de Testing Library, pero envuelto en todos los providers */
export function renderWithProviders(
  ui: ReactElement,
  { auth, route, ...options }: ProvidersOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AllProviders auth={auth} route={route}>
        {children}
      </AllProviders>
    ),
    ...options,
  })
}