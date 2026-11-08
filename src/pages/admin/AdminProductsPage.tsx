import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { FullPageSpinner, Spinner } from '../../components/ui/Spinner'
import { useDebounce } from '../../hooks/useDebounce'
import { useProducts } from '../../hooks/useProducts'
import { deleteProduct } from '../../services/productService'
import type { Product } from '../../types'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { formatPrice } from '../../utils/format'

interface LocationState {
  message?: string
}

export function AdminProductsPage() {
  const location = useLocation()
  const flashMessage = (location.state as LocationState | null)?.message

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const { products, loading, error } = useProducts({ search: debouncedSearch })

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(product: Product) {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return

    setDeletingId(product.id)
    setActionError(null)
    try {
      await deleteProduct(product.id)
      // No hace falta actualizar la lista: onSnapshot la actualiza sola
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          + Nuevo producto
        </Link>
      </div>

      {flashMessage && <Alert type="success">{flashMessage}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      <label htmlFor="admin-product-search" className="sr-only">
        Buscar productos
      </label>
      <input
        id="admin-product-search"
        type="search"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      {loading ? (
        <FullPageSpinner />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : products.length === 0 ? (
        <EmptyState
          title={search ? 'No encontramos productos' : 'Todavía no hay productos'}
          description={search ? 'Probá con otro nombre.' : 'Creá el primero con "+ Nuevo producto".'}
        />
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-3 p-3">
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-lg bg-gray-100 object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {product.category} · {formatPrice(product.price)}
                </p>
                <p
                  className={`text-xs font-medium ${
                    product.stock === 0 ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {product.stock === 0 ? 'Sin stock' : `Stock: ${product.stock}`}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <Link
                  to={`/admin/products/${product.id}/edit`}
                  className="rounded-lg px-3 py-1.5 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(product)}
                  disabled={deletingId !== null}
                  className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === product.id && <Spinner size="sm" />}
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}