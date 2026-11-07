import { Link } from 'react-router-dom'
import type { CartItem } from '../../types'
import { formatPrice } from '../../utils/format'
import { QuantitySelector } from '../ui/QuantitySelector'

interface CartItemRowProps {
  item: CartItem
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  return (
    <div className="flex gap-3 p-4">
      <Link to={`/products/${item.productId}`} className="shrink-0">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-20 w-20 rounded-lg bg-gray-100 object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/products/${item.productId}`}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-sm text-red-600 hover:underline"
            aria-label={`Quitar ${item.name} del carrito`}
          >
            Quitar
          </button>
        </div>

        <p className="text-xs text-gray-500">{formatPrice(item.price)} c/u</p>

        <div className="flex items-center justify-between gap-2">
          <QuantitySelector
            value={item.quantity}
            onChange={onQuantityChange}
            max={item.stock}
            label={`Cantidad de ${item.name}`}
          />
          <p className="text-sm font-bold text-gray-900">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  )
}