import { act, renderHook, waitFor } from '@testing-library/react'
import type { User } from 'firebase/auth'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../contexts/AuthProvider'
import * as authService from '../services/authService'
import { adminProfile, customerProfile } from '../test/test-utils'
import type { UserProfile } from '../types'
import { useAuth } from './useAuth'

// Reemplazamos el servicio entero: el AuthProvider real corre, pero sin Firebase
vi.mock('../services/authService', () => ({
  onAuthChange: vi.fn(),
  ensureUserProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}))

const fakeUser = { uid: 'user-1' } as User

// Guardamos el callback que el AuthProvider registra, para "simular" a Firebase
let emitAuthChange: (user: User | null) => void

/** Una promesa que resolvemos cuando queremos: sirve para congelar el "mientras carga" */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function renderAuth() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>,
  })
}

beforeEach(() => {
  vi.mocked(authService.onAuthChange).mockImplementation((callback) => {
    emitAuthChange = callback
    return () => {}
  })
  vi.mocked(authService.logout).mockResolvedValue(undefined)
})

describe('useAuth', () => {
  it('lanza un error claro si se usa fuera de AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de <AuthProvider>')
  })

  it('arranca en loading hasta que Firebase responde', () => {
    const { result } = renderAuth()
    expect(result.current.status).toBe('loading')
    expect(result.current.profile).toBeNull()
  })

  it('sin usuario queda en unauthenticated', () => {
    const { result } = renderAuth()
    act(() => {
      emitAuthChange(null)
    })
    expect(result.current.status).toBe('unauthenticated')
  })

  it('sigue en loading MIENTRAS carga el rol: no decide antes de tiempo', async () => {
    const pendingProfile = deferred<UserProfile>()
    vi.mocked(authService.ensureUserProfile).mockReturnValue(pendingProfile.promise)
    const { result } = renderAuth()

    act(() => {
      emitAuthChange(fakeUser)
    })

    // Firebase ya dijo que hay usuario, pero el rol todavía no llegó
    expect(result.current.status).toBe('loading')
    expect(result.current.isAdmin).toBe(false)

    await act(async () => {
      pendingProfile.resolve(adminProfile)
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.isAdmin).toBe(true)
  })

  it('un customer queda autenticado pero sin permisos de admin', async () => {
    vi.mocked(authService.ensureUserProfile).mockResolvedValue(customerProfile)
    const { result } = renderAuth()

    act(() => {
      emitAuthChange(fakeUser)
    })

    await waitFor(() => expect(result.current.status).toBe('authenticated'))
    expect(result.current.isAdmin).toBe(false)
  })

  it('si no puede cargar el perfil, cierra la sesión y muestra un error', async () => {
    vi.mocked(authService.ensureUserProfile).mockRejectedValue(new Error('permission-denied'))
    const { result } = renderAuth()

    act(() => {
      emitAuthChange(fakeUser)
    })

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(authService.logout).toHaveBeenCalled()
    expect(result.current.error).toBe('No pudimos cargar tu perfil. Iniciá sesión de nuevo.')
  })

  it('si el login falla, vuelve a unauthenticated y propaga el error', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('auth/invalid-credential'))
    const { result } = renderAuth()
    act(() => {
      emitAuthChange(null)
    })

    await act(async () => {
      await expect(result.current.login('a@b.com', 'mala')).rejects.toThrow('auth/invalid-credential')
    })

    expect(result.current.status).toBe('unauthenticated')
  })

  it('el registro deja al usuario autenticado con su perfil', async () => {
    vi.mocked(authService.register).mockResolvedValue(customerProfile)
    const { result } = renderAuth()
    act(() => {
      emitAuthChange(null)
    })

    await act(async () => {
      await result.current.register('cliente@test.com', 'secreta', 'Cliente Test')
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.profile?.displayName).toBe('Cliente Test')
  })

  it('deja de escuchar a Firebase al desmontarse', () => {
    const unsubscribe = vi.fn()
    vi.mocked(authService.onAuthChange).mockImplementation((callback) => {
      emitAuthChange = callback
      return unsubscribe
    })

    const { unmount } = renderAuth()
    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})