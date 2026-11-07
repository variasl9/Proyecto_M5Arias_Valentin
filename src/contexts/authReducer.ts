import type { UserProfile } from '../types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  profile: UserProfile | null
  error: string | null
}

export type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: UserProfile }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: string }

// La app arranca en 'loading': todavía no sabemos si hay sesión
export const initialAuthState: AuthState = {
  status: 'loading',
  profile: null,
  error: null,
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, status: 'loading', error: null }

    case 'AUTH_SUCCESS':
      return { status: 'authenticated', profile: action.payload, error: null }

    case 'AUTH_LOGOUT':
      // Conserva el error (si lo hay) para poder mostrarlo en el login
      return { status: 'unauthenticated', profile: null, error: state.error }

    case 'AUTH_ERROR':
      return { status: 'unauthenticated', profile: null, error: action.payload }

    default:
      return state
  }
}