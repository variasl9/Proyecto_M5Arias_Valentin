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
  stock: number // stock al momento de agregarlo, para limitar la cantidad
  quantity: number
}

/* ---------- Órdenes ---------- */
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

// Un ítem de orden es una "foto" del producto al momento de la compra
export type OrderItem = Omit<CartItem, 'stock'>

export interface ShippingInfo {
  fullName: string
  address: string
  city: string
  postalCode: string
  phone: string
}

export interface PaymentInfo {
  method: 'card'
  last4: string // nunca guardamos el número completo
  status: 'approved'
}

export interface Order {
  id: string
  userId: string
  userEmail: string
  items: OrderItem[]
  shipping: ShippingInfo
  payment: PaymentInfo
  total: number
  status: OrderStatus
  createdAt: Timestamp
  updatedAt?: Timestamp
}