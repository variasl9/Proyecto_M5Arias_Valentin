import { useEffect, useState } from 'react'
import { getProductById } from '../services/productService'
import type { Product } from '../types'

interface ProductResult {
  id: string
  product: Product | null
  error: string | null
}

interface UseProductReturn {
  product: Product | null
  loading: boolean
  error: string | null
}

export function useProduct(id: string): UseProductReturn {
  const [result, setResult] = useState<ProductResult | null>(null)

  useEffect(() => {
    let active = true

    getProductById(id)
      .then((product) => {
        if (active) setResult({ id, product, error: null })
      })
      .catch((error: unknown) => {
        console.error(error)
        if (active) setResult({ id, product: null, error: 'No pudimos cargar el producto.' })
      })

    return () => {
      active = false
    }
  }, [id])

  if (!result || result.id !== id) {
    return { product: null, loading: true, error: null }
  }

  return { product: result.product, loading: false, error: result.error }
}