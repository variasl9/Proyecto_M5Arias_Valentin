import { Link } from 'react-router-dom'
import { CartItemRow } from '../components/cart/CartItemRow'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/format'

export function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu carrito está vacío"
        description="Explorá el catálogo y agregá los productos que te gusten."
        action={
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  function handleClear() {
    if (window.confirm('¿Vaciar el carrito?')) clearCart()
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Carrito</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {items.map((item) => (
            <li key={item.productId}>
              <CartItemRow
                item={item}
                onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
                onRemove={() => removeItem(item.productId)}
              />
            </li>
          ))}
        </ul>

        <aside className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Productos ({totalItems})</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <div className="flex justify-between border-t border-gray-200 pt-4 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <Link
            to="/checkout"
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Continuar al checkout
          </Link>

          <Button variant="ghost" fullWidth onClick={handleClear}>
            Vaciar carrito
          </Button>
        </aside>
      </div>
    </section>
  )
}