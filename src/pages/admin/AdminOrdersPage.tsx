import { useState } from 'react'
import { OrderStatusControl } from '../../components/admin/OrderStatusControl'
import { OrderItemsList } from '../../components/orders/OrderItemsList'
import { OrderStatusBadge } from '../../components/orders/OrderStatusBadge'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { useAllOrders } from '../../hooks/useAllOrders'
import type { OrderStatus } from '../../types'
import { formatDate, formatOrderId, formatPrice } from '../../utils/format'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../../utils/orderStatus'

function chipClass(active: boolean) {
  return `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  }`
}

export function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const { orders, loading, error } = useAllOrders(statusFilter)

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>

      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
        role="group"
        aria-label="Filtrar por estado"
      >
        <button
          type="button"
          aria-pressed={statusFilter === ''}
          className={chipClass(statusFilter === '')}
          onClick={() => setStatusFilter('')}
        >
          Todas
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={statusFilter === status}
            className={chipClass(statusFilter === status)}
            onClick={() => setStatusFilter(status)}
          >
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <FullPageSpinner />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No hay órdenes"
          description={
            statusFilter
              ? `No hay órdenes en estado "${ORDER_STATUS_LABELS[statusFilter]}".`
              : 'Cuando los clientes compren, las órdenes aparecen acá.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
            return (
              <li
                key={order.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Orden {formatOrderId(order.id)}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-gray-700">{order.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <OrderStatusBadge status={order.status} />
                    <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                </div>

                <details className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    {itemCount} {itemCount === 1 ? 'producto' : 'productos'} · Envío a{' '}
                    {order.shipping.city}
                  </summary>
                  <OrderItemsList items={order.items} />
                  <p className="pt-2 text-xs text-gray-600">
                    {order.shipping.fullName} · {order.shipping.address} ·{' '}
                    {order.shipping.postalCode} · Tel: {order.shipping.phone}
                  </p>
                </details>

                {/* La key con el estado reinicia el control cuando el estado cambia */}
                <OrderStatusControl key={`${order.id}-${order.status}`} order={order} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}