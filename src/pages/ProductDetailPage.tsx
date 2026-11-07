import { Link, useParams } from 'react-router-dom'
import { AddToCart } from '../components/products/AddToCart'
import { Alert } from '../components/ui/Alert'
import { EmptyState } from '../components/ui/EmptyState'
import { FullPageSpinner } from '../components/ui/Spinner'
import { useProduct } from '../hooks/useProduct'
import { formatPrice } from '../utils/format'

export function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { product, loading, error } = useProduct(id)

  if (loading) return <FullPageSpinner />

  if (error) return <Alert>{error}</Alert>

  if (!product) {
    return (
      <EmptyState
        title="Producto no encontrado"
        description="Puede que haya sido eliminado o que el enlace no sea correcto."
        action={
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            Volver al catálogo
          </Link>
        }
      />
    )
  }

  const outOfStock = product.stock === 0

  return (
    <article className="flex flex-col gap-6">
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Volver al catálogo
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-wide text-gray-500">{product.category}</span>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{product.name}</h1>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>
          <p className="text-gray-700">{product.description}</p>

          <p className={`text-sm font-medium ${outOfStock ? 'text-red-600' : 'text-green-700'}`}>
            {outOfStock ? 'Sin stock' : `${product.stock} unidades disponibles`}
          </p>

          <AddToCart product={product} />
        </div>
      </div>
    </article>
  )
}