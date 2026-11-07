import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { formatPrice } from '../../utils/format'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const outOfStock = product.stock === 0

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-gray-900/80 px-2 py-1 text-xs font-medium text-white">
            Sin stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs uppercase tracking-wide text-gray-500">{product.category}</span>
        <h2 className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h2>
        <p className="mt-auto pt-1 text-base font-bold text-gray-900">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}