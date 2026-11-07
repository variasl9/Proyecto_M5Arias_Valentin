import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Product, ProductInput } from '../types'

const PRODUCTS_COLLECTION = 'products'
const productsRef = collection(db, PRODUCTS_COLLECTION)

export interface ProductFilters {
  category?: string
  search?: string
}

function toProduct(snap: DocumentSnapshot): Product {
  // 'estimate': si createdAt todavía no lo confirmó el servidor, usa una hora estimada
  return { id: snap.id, ...snap.data({ serverTimestamps: 'estimate' }) } as Product
}

function buildConstraints({ category, search }: ProductFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = []

  if (category) {
    constraints.push(where('category', '==', category))
  }

  const term = search?.trim().toLowerCase()
  if (term) {
    // Búsqueda por prefijo: todo lo que empieza con "term"
    constraints.push(
      where('nameLower', '>=', term),
      where('nameLower', '<=', term + '\uf8ff'),
      orderBy('nameLower'),
    )
  } else {
    constraints.push(orderBy('createdAt', 'desc'))
  }

  return constraints
}

/** Escucha los productos en tiempo real. Devuelve la función para dejar de escuchar. */
export function subscribeToProducts(
  filters: ProductFilters,
  onData: (products: Product[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(productsRef, ...buildConstraints(filters))
  return onSnapshot(q, (snapshot) => onData(snapshot.docs.map(toProduct)), onError)
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id))
  return snap.exists() ? toProduct(snap) : null
}

function normalize(input: ProductInput) {
  const name = input.name.trim()
  return { ...input, name, nameLower: name.toLowerCase() }
}

export async function createProduct(input: ProductInput): Promise<string> {
  const ref = await addDoc(productsRef, {
    ...normalize(input),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), normalize(input))
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id))
}