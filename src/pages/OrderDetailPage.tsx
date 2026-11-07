import { Link, useLocation, useParams } from 'react-router-dom'
import { OrderItemsList } from '../components/orders/OrderItemsList'
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge'
import { Alert } from '../components/ui/Alert'
import { EmptyState } from '../components/ui/EmptyState'
import { FullPageSpinner } from '../components/ui/Spinner'
import { useOrder } from '../hooks/useOrder'
import { formatDate, formatOrderId, formatPrice } from '../utils/format'

interface LocationState {
  justPlaced?: boolean
}

const CARD_CLASSES = 'rounded-xl border border-gray-200 bg-white p-4'

export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const justPlaced = (location.state as LocationState | null)?.justPlaced === true
  const { order, loading, error } = useOrder(id)

  if (loading) return <FullPageSpinner />

  if (error) return <Alert>{error}</Alert>

  if (!order) {
    return (
      <EmptyState
        title="Orden no encontrada"
        description="Puede que el enlace no sea correcto."
        action={
          <Link to="/orders" className="font-medium text-indigo-600 hover:underline">
            Ver mis órdenes
          </Link>
        }
      />
    )
  }

  return (
    <article className="flex flex-col gap-6">
      <Link to="/orders" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Mis órdenes
      </Link>

      {justPlaced && (
        <Alert type="success">
          ¡Gracias por tu compra! Tu pago fue aprobado y la orden quedó registrada.
        </Alert>
      )}

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orden {formatOrderId(order.id)}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <section className={CARD_CLASSES}>
          <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
          <OrderItemsList items={order.items} />
          <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className={CARD_CLASSES}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Envío</h2>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{order.shipping.fullName}</p>
              <p>{order.shipping.address}</p>
              <p>
                {order.shipping.city} ({order.shipping.postalCode})
              </p>
              <p>Tel: {order.shipping.phone}</p>
            </div>
          </section>

          <section className={CARD_CLASSES}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Pago</h2>
            <p className="text-sm text-gray-700">Tarjeta terminada en {order.payment.last4}</p>
            <p className="text-sm font-medium text-green-700">Aprobado</p>
          </section>
        </aside>
      </div>
    </article>
  )
}