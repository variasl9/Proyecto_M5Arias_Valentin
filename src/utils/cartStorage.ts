import type { CartItem } from '../types'

const STORAGE_KEY = 'patagonix-cart'

/** Verifica que un dato desconocido tenga la forma de un CartItem */
export function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.productId === 'string' &&
    typeof v.name === 'string' &&
    typeof v.price === 'number' &&
    typeof v.imageUrl === 'string' &&
    typeof v.stock === 'number' &&
    typeof v.quantity === 'number'
  )
}

export function loadLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    // JSON corrupto o localStorage bloqueado: arrancamos con el carrito vacío
    return []
  }
}

export function saveLocalCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Modo incógnito o almacenamiento lleno: el carrito sigue funcionando en memoria
  }
}

export function clearLocalCart(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignorado a propósito
  }
}