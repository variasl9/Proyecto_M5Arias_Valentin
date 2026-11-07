import type { CartItem } from '../types'

export interface CartState {
  items: CartItem[]
}

// Lo que se recibe al agregar: un ítem todavía sin cantidad
export type NewCartItem = Omit<CartItem, 'quantity'>

export type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: NewCartItem; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'MERGE_CART'; payload: { items: CartItem[] } }

export const initialCartState: CartState = { items: [] }

/** Mantiene la cantidad entre 0 y el stock disponible */
function clampToStock(quantity: number, stock: number): number {
  return Math.max(0, Math.min(quantity, stock))
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity = 1 } = action.payload
      if (quantity <= 0 || item.stock <= 0) return state

      const existing = state.items.find((i) => i.productId === item.productId)

      if (existing) {
        // Ya estaba: sumamos la cantidad y actualizamos precio/stock por si cambiaron
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, ...item, quantity: clampToStock(i.quantity + quantity, item.stock) }
              : i,
          ),
        }
      }

      return {
        items: [...state.items, { ...item, quantity: clampToStock(quantity, item.stock) }],
      }
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter((i) => i.productId !== action.payload.productId),
      }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      // Cantidad 0 o negativa = quitar el producto
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.productId !== productId) }
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: clampToStock(quantity, i.stock) } : i,
        ),
      }
    }

    case 'CLEAR_CART':
      return initialCartState

    case 'MERGE_CART':
      return { items: mergeCartItems(state.items, action.payload.items) }

    default:
      return state
  }
}

/**
 * Fusiona el carrito local (del visitante) con el guardado en la nube.
 * Si un producto está en los dos, suma las cantidades sin pasar el stock.
 */
export function mergeCartItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>()

  for (const item of remote) {
    merged.set(item.productId, item)
  }

  for (const item of local) {
    const existing = merged.get(item.productId)
    merged.set(
      item.productId,
      existing
        ? { ...existing, ...item, quantity: clampToStock(existing.quantity + item.quantity, item.stock) }
        : item,
    )
  }

  return [...merged.values()]
}

/* ---------- Selectores: valores derivados, NO se guardan en el estado ---------- */

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}