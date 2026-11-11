import type { ProductSales } from '../../utils/analytics'
import { formatPrice } from '../../utils/format'

interface TopProductsListProps {
  products: ProductSales[]
}

export function TopProductsList({ products }: TopProductsListProps) {
  const maxUnits = products.at(0)?.units ?? 0

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-gray-900">Productos más vendidos</h2>

      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Todavía no hay ventas.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-4">
          {products.map((product, index) => (
            <li key={product.productId} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-sm font-bold text-gray-400">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">{product.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">{formatPrice(product.revenue)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(product.units / maxUnits) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-gray-700">
                    {product.units} {product.units === 1 ? 'unidad' : 'unid.'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
