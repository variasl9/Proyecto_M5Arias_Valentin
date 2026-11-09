import { describe, expect, it } from 'vitest'
import type { UserProfile } from '../types'
import { authReducer, initialAuthState, type AuthState } from './authReducer'

const profile: UserProfile = {
  uid: 'user-1',
  email: 'cliente@test.com',
  displayName: 'Cliente',
  role: 'customer',
  createdAt: {} as UserProfile['createdAt'],
}

describe('authReducer', () => {
  it('arranca en loading: todavía no sabemos si hay sesión', () => {
    expect(initialAuthState).toEqual({ status: 'loading', profile: null, error: null })
  })

  it('AUTH_SUCCESS guarda el perfil y limpia errores previos', () => {
    const state: AuthState = { status: 'loading', profile: null, error: 'error viejo' }
    expect(authReducer(state, { type: 'AUTH_SUCCESS', payload: profile })).toEqual({
      status: 'authenticated',
      profile,
      error: null,
    })
  })

  it('AUTH_LOADING vuelve a loading y limpia el error', () => {
    const state: AuthState = { status: 'unauthenticated', profile: null, error: 'error viejo' }
    expect(authReducer(state, { type: 'AUTH_LOADING' })).toEqual({
      status: 'loading',
      profile: null,
      error: null,
    })
  })

  it('AUTH_LOGOUT borra el perfil pero conserva el error para mostrarlo en el login', () => {
    const state: AuthState = { status: 'authenticated', profile, error: 'No pudimos cargar tu perfil' }
    expect(authReducer(state, { type: 'AUTH_LOGOUT' })).toEqual({
      status: 'unauthenticated',
      profile: null,
      error: 'No pudimos cargar tu perfil',
    })
  })

  it('AUTH_ERROR deja al usuario sin sesión con el mensaje', () => {
    expect(authReducer(initialAuthState, { type: 'AUTH_ERROR', payload: 'Falló' })).toEqual({
      status: 'unauthenticated',
      profile: null,
      error: 'Falló',
    })
  })
})