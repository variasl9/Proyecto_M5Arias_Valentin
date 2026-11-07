import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { CartItem } from '../types'
import { isCartItem } from '../utils/cartStorage'

const CARTS_COLLECTION = 'carts'

export async function getCart(uid: string): Promise<CartItem[]> {
  const snap = await getDoc(doc(db, CARTS_COLLECTION, uid))
  if (!snap.exists()) return []
  const items: unknown = snap.data().items
  return Array.isArray(items) ? items.filter(isCartItem) : []
}

export async function saveCart(uid: string, items: CartItem[]): Promise<void> {
  await setDoc(doc(db, CARTS_COLLECTION, uid), {
    items,
    updatedAt: serverTimestamp(),
  })
}