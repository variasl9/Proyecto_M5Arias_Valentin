import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import * as authService from '../services/authService'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { authReducer, initialAuthState } from './authReducer'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  useEffect(() => {
    let active = true

    const unsubscribe = authService.onAuthChange(async (user) => {
      if (!user) {
        dispatch({ type: 'AUTH_LOGOUT' })
        return
      }

      // Hay usuario en Firebase, pero el rol todavía no llegó: seguimos en 'loading'
      dispatch({ type: 'AUTH_LOADING' })

      try {
        const profile = await authService.ensureUserProfile(user)
        if (active) dispatch({ type: 'AUTH_SUCCESS', payload: profile })
      } catch {
        if (!active) return
        // Sin perfil no hay rol: cerramos la sesión para no quedar en un estado inconsistente
        await authService.logout()
        dispatch({
          type: 'AUTH_ERROR',
          payload: 'No pudimos cargar tu perfil. Iniciá sesión de nuevo.',
        })
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAdmin: state.profile?.role === 'admin',

      login: async (email, password) => {
        dispatch({ type: 'AUTH_LOADING' })
        try {
          await authService.login(email, password)
          // El listener de onAuthChange se encarga de cargar el perfil
        } catch (error) {
          dispatch({ type: 'AUTH_LOGOUT' })
          throw error // la página de login muestra el mensaje
        }
      },

      register: async (email, password, displayName) => {
        dispatch({ type: 'AUTH_LOADING' })
        try {
          const profile = await authService.register(email, password, displayName)
          dispatch({ type: 'AUTH_SUCCESS', payload: profile })
        } catch (error) {
          dispatch({ type: 'AUTH_LOGOUT' })
          throw error
        }
      },

      loginWithGoogle: async () => {
        dispatch({ type: 'AUTH_LOADING' })
        try {
          await authService.loginWithGoogle()
        } catch (error) {
          dispatch({ type: 'AUTH_LOGOUT' })
          throw error
        }
      },

      logout: () => authService.logout(),
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}