import { Link } from 'react-router-dom'
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge'
import { Alert } from '../components/ui/Alert'
import { EmptyState } from '../components/ui/EmptyState'
import { FullPageSpinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useUserOrders } from '../hooks/useUserOrders'
import { formatDate, formatOrderId, formatPrice } from '../utils/format'

export function OrdersPage() {
  const { profile } = useAuth()
  const { orders, loading, error } = useUserOrders(profile?.uid)

  if (loading) return <FullPageSpinner />

  if (error) return <Alert>{error}</Alert>

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Todavía no hiciste compras"
        description="Cuando confirmes tu primera compra, la vas a ver acá."
        action={
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Mis órdenes</h1>

      <ul className="flex flex-col gap-3">
        {orders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
          return (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">Orden {formatOrderId(order.id)}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)} · {itemCount}{' '}
                    {itemCount === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <OrderStatusBadge status={order.status} />
                  <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}