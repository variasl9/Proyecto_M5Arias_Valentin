import { useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getCart, saveCart } from '../services/cartService'
import { clearLocalCart, loadLocalCart, saveLocalCart } from '../utils/cartStorage'
import { CartContext, type CartContextValue } from './CartContext'
import { cartReducer, getCartCount, getCartTotal } from './cartReducer'

const CLOUD_SAVE_DELAY = 500

export function CartProvider({ children }: { children: ReactNode }) {
  const { status, profile } = useAuth()
  const uid = status === 'authenticated' ? (profile?.uid ?? null) : null

  // El estado inicial se lee del localStorage una sola vez (inicialización perezosa)
  const [state, dispatch] = useReducer(cartReducer, undefined, () => ({
    items: loadLocalCart(),
  }))

  // UID cuyo carrito de la nube ya se cargó. Hasta que no se carga, NO guardamos en la nube
  // (si no, podríamos pisar el carrito guardado con uno vacío).
  const syncedUidRef = useRef<string | null>(null)

  // 1) Sincronización al iniciar o cerrar sesión
  useEffect(() => {
    if (status === 'loading') return

    if (!uid) {
      // Cerró sesión: vaciamos la pantalla (su carrito queda guardado en la nube)
      if (syncedUidRef.current) {
        syncedUidRef.current = null
        dispatch({ type: 'CLEAR_CART' })
      }
      return
    }

    let active = true

    getCart(uid)
      .then((remoteItems) => {
        if (!active) return
        // Fusionamos lo que armó como visitante con lo que tenía guardado
        dispatch({ type: 'MERGE_CART', payload: { items: remoteItems } })
        clearLocalCart()
        syncedUidRef.current = uid
      })
      .catch((error: unknown) => {
        // Si falla, el carrito sigue funcionando en memoria pero no se guarda en la nube
        console.error('No se pudo cargar el carrito de la nube', error)
      })

    return () => {
      active = false
    }
  }, [status, uid])

  // 2) Persistencia en cada cambio del carrito
  useEffect(() => {
    if (status === 'loading') return

    if (!uid) {
      saveLocalCart(state.items)
      return
    }

    if (syncedUidRef.current !== uid) return

    // Debounce: si el usuario toca "+" cinco veces seguidas, guardamos una sola vez
    const timer = setTimeout(() => {
      saveCart(uid, state.items).catch((error: unknown) => {
        console.error('No se pudo guardar el carrito en la nube', error)
      })
    }, CLOUD_SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [state.items, status, uid])

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      totalItems: getCartCount(state.items),
      totalPrice: getCartTotal(state.items),

      addItem: (product, quantity = 1) =>
        dispatch({
          type: 'ADD_ITEM',
          payload: {
            item: {
              productId: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              stock: product.stock,
            },
            quantity,
          },
        }),

      removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', payload: { productId } }),

      updateQuantity: (productId, quantity) =>
        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } }),

      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    }),
    [state.items],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}