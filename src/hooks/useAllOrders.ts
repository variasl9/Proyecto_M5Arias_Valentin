import { useEffect, useState } from 'react'
import { subscribeToAllOrders } from '../services/orderService'
import type { Order, OrderStatus } from '../types'

interface AllOrdersResult {
  status: OrderStatus | ''
  orders: Order[]
  error: string | null
}

interface UseAllOrdersReturn {
  orders: Order[]
  loading: boolean
  error: string | null
}

/** Todas las órdenes (solo admin), en tiempo real. '' = sin filtro de estado. */
export function useAllOrders(status: OrderStatus | ''): UseAllOrdersReturn {
  const [result, setResult] = useState<AllOrdersResult | null>(null)

  useEffect(() => {
    return subscribeToAllOrders(
      status,
      (orders) => setResult({ status, orders, error: null }),
      (error) => {
        console.error(error) // si falta el índice 4, acá aparece el link
        setResult({ status, orders: [], error: 'No pudimos cargar las órdenes.' })
      },
    )
  }, [status])

  if (!result || result.status !== status) {
    return { orders: [], loading: true, error: null }
  }

  return { orders: result.orders, loading: false, error: result.error }
}