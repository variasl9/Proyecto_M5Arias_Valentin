import { useState } from 'react'
import { ProductFilters } from '../components/products/ProductFilters'
import { ProductGrid } from '../components/products/ProductGrid'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useDebounce } from '../hooks/useDebounce'
import { useProducts } from '../hooks/useProducts'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  // La query usa el valor "demorado", no el que cambia en cada tecla
  const debouncedSearch = useDebounce(search, 400)
  const { products, loading, error } = useProducts({ category, search: debouncedSearch })

  const hasFilters = search.trim() !== '' || category !== ''

  function clearFilters() {
    setSearch('')
    setCategory('')
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="mt-1 text-sm text-gray-600">Equipamiento outdoor para la Patagonia.</p>
      </div>

      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
      />

      {error ? (
        <Alert>{error}</Alert>
      ) : !loading && products.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No encontramos productos' : 'Todavía no hay productos'}
          description={
            hasFilters
              ? 'Probá con otro nombre o con otra categoría.'
              : 'Cuando el administrador cargue productos, los vas a ver acá.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ProductGrid products={products} loading={loading} />
      )}
    </section>
  )
}