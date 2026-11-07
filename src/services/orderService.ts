import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentSnapshot,
  type FirestoreError,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentInfo,
  Product,
  ShippingInfo,
} from '../types'
import { AppError } from '../utils/errors'
import { canTransition, ORDER_STATUS_LABELS } from '../utils/orderStatus'

const ORDERS_COLLECTION = 'orders'
const PRODUCTS_COLLECTION = 'products'
const ordersRef = collection(db, ORDERS_COLLECTION)

type ProductData = Omit<Product, 'id'>
type OrderData = Omit<Order, 'id'>

function toOrder(snap: DocumentSnapshot): Order {
  return { id: snap.id, ...snap.data({ serverTimestamps: 'estimate' }) } as Order
}

/* =========================================================
 * Cliente
 * ========================================================= */

export interface CreateOrderParams {
  userId: string
  userEmail: string
  items: CartItem[]
  shipping: ShippingInfo
  payment: PaymentInfo
}

/**
 * Crea la orden y descuenta el stock en UNA transacción:
 * o se hace todo, o no se hace nada. Evita vender más unidades de las que hay
 * si dos clientes compran el mismo producto al mismo tiempo.
 */
export async function createOrder({
  userId,
  userEmail,
  items,
  shipping,
  payment,
}: CreateOrderParams): Promise<string> {
  if (items.length === 0) throw new AppError('Tu carrito está vacío.')

  // Generamos el ID antes, para poder devolverlo al terminar
  const orderRef = doc(ordersRef)

  await runTransaction(db, async (transaction) => {
    const productRefs = items.map((item) => doc(db, PRODUCTS_COLLECTION, item.productId))

    // 1) Leer: en una transacción, todas las lecturas van antes que las escrituras
    const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)))

    // 2) Validar y armar los ítems con el precio REAL de Firestore (no el del carrito)
    const orderItems: OrderItem[] = productSnaps.map((snap, index) => {
      const item = items[index]

      if (!snap.exists()) {
        throw new AppError(`"${item.name}" ya no está disponible. Quitalo del carrito para continuar.`)
      }

      const product = snap.data() as ProductData

      if (product.stock < item.quantity) {
        throw new AppError(
          product.stock === 0
            ? `"${product.name}" se quedó sin stock. Quitalo del carrito para continuar.`
            : `Solo quedan ${product.stock} unidades de "${product.name}". Ajustá la cantidad en el carrito.`,
        )
      }

      return {
        productId: item.productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
      }
    })

    // 3) Escribir: descontar stock y crear la orden
    productSnaps.forEach((snap, index) => {
      const currentStock = (snap.data() as ProductData).stock
      transaction.update(productRefs[index], { stock: currentStock - items[index].quantity })
    })

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    transaction.set(orderRef, {
      userId,
      userEmail,
      items: orderItems,
      shipping,
      payment,
      total,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
  })

  return orderRef.id
}

/** Órdenes de un usuario, en tiempo real (ve los cambios de estado al instante) */
export function subscribeToUserOrders(
  userId: string,
  onData: (orders: Order[]) => void,
  onError: (error: FirestoreError) => void,
) {
  const q = query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => onData(snapshot.docs.map(toOrder)), onError)
}

/** Una orden, en tiempo real. Devuelve null si no existe. */
export function subscribeToOrder(
  orderId: string,
  onData: (order: Order | null) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    doc(db, ORDERS_COLLECTION, orderId),
    (snap) => onData(snap.exists() ? toOrder(snap) : null),
    onError,
  )
}

/* =========================================================
 * Administración (se usa en la Fase 6)
 * ========================================================= */

/** Todas las órdenes, opcionalmente filtradas por estado */
export function subscribeToAllOrders(
  status: OrderStatus | '',
  onData: (orders: Order[]) => void,
  onError: (error: FirestoreError) => void,
) {
  const constraints: QueryConstraint[] = []
  if (status) constraints.push(where('status', '==', status))
  constraints.push(orderBy('createdAt', 'desc'))

  const q = query(ordersRef, ...constraints)
  return onSnapshot(q, (snapshot) => onData(snapshot.docs.map(toOrder)), onError)
}

/**
 * Cambia el estado respetando el flujo permitido.
 * Si la orden se cancela, devuelve el stock a los productos.
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId)

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef)
    if (!orderSnap.exists()) throw new AppError('La orden no existe.')

    const order = orderSnap.data() as OrderData

    if (!canTransition(order.status, newStatus)) {
      throw new AppError(
        `No se puede pasar de "${ORDER_STATUS_LABELS[order.status]}" a "${ORDER_STATUS_LABELS[newStatus]}".`,
      )
    }

    if (newStatus === 'cancelled') {
      const productRefs = order.items.map((item) => doc(db, PRODUCTS_COLLECTION, item.productId))
      const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)))

      productSnaps.forEach((snap, index) => {
        if (!snap.exists()) return // el producto fue eliminado: no hay stock que devolver
        const currentStock = (snap.data() as ProductData).stock
        transaction.update(productRefs[index], {
          stock: currentStock + order.items[index].quantity,
        })
      })
    }

    transaction.update(orderRef, { status: newStatus, updatedAt: serverTimestamp() })
  })
}