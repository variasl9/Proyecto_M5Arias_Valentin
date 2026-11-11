import type { OrderStatus } from '../../types'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../../utils/orderStatus'

const BAR_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-400',
  processing: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-400',
}

interface OrdersByStatusProps {
  counts: Record<OrderStatus, number>
}

export function OrdersByStatus({ counts }: OrdersByStatusProps) {
  const total = ORDER_STATUSES.reduce((sum, status) => sum + counts[status], 0)

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-gray-900">Órdenes por estado</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {ORDER_STATUSES.map((status) => {
          const share = total > 0 ? (counts[status] / total) * 100 : 0
          return (
            <li key={status}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{ORDER_STATUS_LABELS[status]}</span>
                <span className="font-medium text-gray-900">{counts[status]}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${BAR_COLORS[status]}`} style={{ width: `${share}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}