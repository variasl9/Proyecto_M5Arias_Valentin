import { useEffect, useState } from 'react'
import { subscribeToOrder } from '../services/orderService'
import type { Order } from '../types'

interface OrderResult {
  orderId: string
  order: Order | null
  error: string | null
}

interface UseOrderReturn {
  order: Order | null
  loading: boolean
  error: string | null
}

export function useOrder(orderId: string): UseOrderReturn {
  const [result, setResult] = useState<OrderResult | null>(null)

  useEffect(() => {
    return subscribeToOrder(
      orderId,
      (order) => setResult({ orderId, order, error: null }),
      (error) => {
        // Si la orden es de otro usuario, Firestore niega el acceso:
        // lo mostramos como "no encontrada" para no revelar que existe
        const notAllowed = error.code === 'permission-denied'
        if (!notAllowed) console.error(error)
        setResult({
          orderId,
          order: null,
          error: notAllowed ? null : 'No pudimos cargar la orden.',
        })
      },
    )
  }, [orderId])

  if (!result || result.orderId !== orderId) {
    return { order: null, loading: true, error: null }
  }

  return { order: result.order, loading: false, error: result.error }
}