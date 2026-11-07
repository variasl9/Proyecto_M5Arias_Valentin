import { useEffect, useState } from 'react'
import { subscribeToProducts, type ProductFilters } from '../services/productService'
import type { Product } from '../types'

interface ProductsResult {
  key: string
  products: Product[]
  error: string | null
}

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useProducts({ category, search }: ProductFilters): UseProductsReturn {
  // Identifica la combinación de filtros actual
  const key = `${category ?? ''}|${search ?? ''}`
  const [result, setResult] = useState<ProductsResult | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      { category, search },
      (products) => setResult({ key, products, error: null }),
      (error) => {
        console.error(error) // si falta un índice, acá aparece el link para crearlo
        setResult({ key, products: [], error: 'No pudimos cargar los productos. Intentá de nuevo.' })
      },
    )
    return unsubscribe
  }, [key, category, search])

  // Si el resultado guardado es de otros filtros, todavía estamos cargando
  if (!result || result.key !== key) {
    return { products: [], loading: true, error: null }
  }

  return { products: result.products, loading: false, error: result.error }
}