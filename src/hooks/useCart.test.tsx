import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../contexts/AuthContext'
import { getCart, saveCart } from '../services/cartService'
import {
  AllProviders,
  authenticatedAs,
  createAuthValue,
  customerProfile,
} from '../test/test-utils'
import type { CartItem, Product } from '../types'
import { useCart } from './useCart'

const STORAGE_KEY = 'patagonix-cart'

const campera: Product = {
  id: 'p1',
  name: 'Campera',
  nameLower: 'campera',
  description: 'Abrigo',
  price: 100,
  category: 'Camperas',
  imageUrl: 'campera.jpg',
  stock: 3,
  createdAt: {} as Product['createdAt'],
}

const botasEnLaNube: CartItem = {
  productId: 'p2',
  name: 'Botas',
  price: 50,
  imageUrl: 'botas.jpg',
  stock: 2,
  quantity: 1,
}

function renderCart(auth: AuthContextValue = createAuthValue()) {
  return renderHook(() => useCart(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AllProviders auth={auth}>{children}</AllProviders>
    ),
  })
}

describe('useCart', () => {
  it('lanza un error claro si se usa fuera de CartProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // React loguea el error: lo silenciamos
    expect(() => renderHook(() => useCart())).toThrow('useCart debe usarse dentro de <CartProvider>')
  })

  it('arranca vacío', () => {
    const { result } = renderCart()
    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it('agrega productos y recalcula los totales', () => {
    const { result } = renderCart()
    act(() => result.current.addItem(campera, 2))
    expect(result.current.totalItems).toBe(2)
    expect(result.current.totalPrice).toBe(200)
  })

  it('no permite superar el stock', () => {
    const { result } = renderCart()
    act(() => result.current.addItem(campera, 10))
    expect(result.current.totalItems).toBe(3)
  })

  it('actualiza cantidades, quita productos y vacía el carrito', () => {
    const { result } = renderCart()

    act(() => result.current.addItem(campera))
    act(() => result.current.updateQuantity('p1', 3))
    expect(result.current.totalItems).toBe(3)

    act(() => result.current.removeItem('p1'))
    expect(result.current.items).toEqual([])

    act(() => result.current.addItem(campera))
    act(() => result.current.clearCart())
    expect(result.current.items).toEqual([])
  })

  describe('visitante (sin sesión)', () => {
    it('guarda el carrito en localStorage y no en la nube', () => {
      const { result } = renderCart()
      act(() => result.current.addItem(campera))

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[]
      expect(saved).toEqual([expect.objectContaining({ productId: 'p1', quantity: 1 })])
      expect(saveCart).not.toHaveBeenCalled()
    })

    it('recupera el carrito guardado al recargar la página', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([botasEnLaNube]))
      const { result } = renderCart()
      expect(result.current.items).toEqual([botasEnLaNube])
    })

    it('descarta datos corruptos del localStorage en vez de romperse', () => {
      localStorage.setItem(STORAGE_KEY, '{esto no es JSON')
      const { result } = renderCart()
      expect(result.current.items).toEqual([])
    })
  })

  describe('usuario con sesión', () => {
    it('fusiona el carrito del visitante con el guardado en la nube', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([{ productId: 'p1', name: 'Campera', price: 100, imageUrl: 'campera.jpg', stock: 3, quantity: 1 }]),
      )
      vi.mocked(getCart).mockResolvedValueOnce([botasEnLaNube])

      const { result } = renderCart(authenticatedAs(customerProfile))

      await waitFor(() => expect(result.current.items).toHaveLength(2))
      expect(getCart).toHaveBeenCalledWith('user-1')
      // El carrito local ya se fusionó: se borra para no duplicarlo después
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('guarda en Firestore agrupando los clics seguidos (debounce)', async () => {
      const { result } = renderCart(authenticatedAs(customerProfile))
      await waitFor(() => expect(getCart).toHaveBeenCalled())
      await act(async () => {}) // deja terminar la carga del carrito remoto

      act(() => result.current.addItem(campera))
      act(() => result.current.addItem(campera))
      act(() => result.current.addItem(campera))

      await waitFor(() =>
        expect(saveCart).toHaveBeenLastCalledWith('user-1', [
          expect.objectContaining({ productId: 'p1', quantity: 3 }),
        ]),
      )

      // Gracias al debounce, nunca se guardaron los estados intermedios (1 y 2 unidades)
      const intermediateSaves = vi
        .mocked(saveCart)
        .mock.calls.filter(([, items]) => items.some((i) => i.quantity === 1 || i.quantity === 2))
      expect(intermediateSaves).toHaveLength(0)
    })
  })
})