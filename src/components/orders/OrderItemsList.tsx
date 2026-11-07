import type { OrderItem } from '../../types'
import { formatPrice } from '../../utils/format'

interface OrderItemsListProps {
  items: OrderItem[]
}

/** Lista de solo lectura. Sirve para el checkout (con CartItem) y para el detalle de orden. */
export function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.productId} className="flex items-center gap-3 py-3">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-14 w-14 shrink-0 rounded-lg bg-gray-100 object-cover"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">
              {item.quantity} × {formatPrice(item.price)}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {formatPrice(item.price * item.quantity)}
          </p>
        </li>
      ))}
    </ul>
  )
}