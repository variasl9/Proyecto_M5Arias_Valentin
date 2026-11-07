import { PRODUCT_CATEGORIES } from '../../utils/constants'

interface ProductFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
}

function chipClass(active: boolean) {
  return `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-indigo-600 bg-indigo-600 text-white'
      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  }`
}

export function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="sr-only" htmlFor="product-search">
        Buscar productos
      </label>
      <input
        id="product-search"
        type="search"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      {/* En el celular las categorías se deslizan horizontalmente */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar por categoría">
        <button
          type="button"
          aria-pressed={category === ''}
          className={chipClass(category === '')}
          onClick={() => onCategoryChange('')}
        >
          Todas
        </button>
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={category === cat}
            className={chipClass(category === cat)}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}