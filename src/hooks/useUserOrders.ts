import { useEffect, useState } from 'react'
import { subscribeToUserOrders } from '../services/orderService'
import type { Order } from '../types'

interface OrdersResult {
  userId: string
  orders: Order[]
  error: string | null
}

interface UseUserOrdersReturn {
  orders: Order[]
  loading: boolean
  error: string | null
}

export function useUserOrders(userId: string | undefined): UseUserOrdersReturn {
  const [result, setResult] = useState<OrdersResult | null>(null)

  useEffect(() => {
    if (!userId) return

    return subscribeToUserOrders(
      userId,
      (orders) => setResult({ userId, orders, error: null }),
      (error) => {
        console.error(error) // si falta el índice, acá aparece el link para crearlo
        setResult({ userId, orders: [], error: 'No pudimos cargar tus órdenes. Intentá de nuevo.' })
      },
    )
  }, [userId])

  if (!result || result.userId !== userId) {
    return { orders: [], loading: true, error: null }
  }

  return { orders: result.orders, loading: false, error: result.error }
}