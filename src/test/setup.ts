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

afterEach(() => {
  localStorage.clear()
})