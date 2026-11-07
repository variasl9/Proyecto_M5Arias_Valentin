import type { Timestamp } from 'firebase/firestore'

/* ---------- Usuarios ---------- */
export type UserRole = 'customer' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName: string | null
  role: UserRole
  createdAt: Timestamp
}

/* ---------- Productos ---------- */
export interface Product {
  id: string
  name: string
  nameLower: string // copia en minúsculas del nombre, para la búsqueda
  description: string
  price: number
  category: string
  imageUrl: string
  stock: number
  createdAt: Timestamp
}

// Lo que el admin completa en el formulario (el resto lo genera el servicio)
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'nameLower'>

/* ---------- Carrito ---------- */
export interface CartItem {
  productId: string
  name: string
  price: number
  imageUrl: string
  quantity: number
}

/* ---------- Órdenes ---------- */
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export interface Order {
  id: string
  userId: string
  userEmail: string
  items: CartItem[]
  total: number
  status: OrderStatus
  createdAt: Timestamp
}

export type OrderInput = Omit<Order, 'id' | 'createdAt'>