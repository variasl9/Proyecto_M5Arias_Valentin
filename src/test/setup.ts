import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Firebase NUNCA se inicializa en los tests: ningún test depende de servicios reales
vi.mock('../services/firebase', () => ({
  app: {},
  auth: { currentUser: null },
  db: {},
  googleProvider: {},
}))

// El carrito en la nube se mockea por defecto (cada test puede redefinirlo)
vi.mock('../services/cartService', () => ({
  getCart: vi.fn(async () => []),
  saveCart: vi.fn(async () => undefined),
}))

// Los tests de la Vercel Function corren en entorno Node, donde no hay window ni localStorage
const isBrowserEnvironment = typeof window !== 'undefined'

if (isBrowserEnvironment) {
  // Los tests "useX debe usarse dentro de <Provider>" provocan ese error A PROPÓSITO.
  // React lo maneja, pero jsdom igual lo imprime: lo silenciamos solo para ese mensaje.
  window.addEventListener('error', (event) => {
    if (event.error instanceof Error && event.error.message.includes('debe usarse dentro de <')) {
      event.preventDefault()
    }
  })
}

afterEach(() => {
  if (isBrowserEnvironment) localStorage.clear()
})