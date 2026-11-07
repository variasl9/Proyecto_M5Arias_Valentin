import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import type { Product } from '../../types'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { QuantitySelector } from '../ui/QuantitySelector'

interface AddToCartProps {
  product: Product
}

export function AddToCart({ product }: AddToCartProps) {
  const { items, addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const inCart = items.find((item) => item.productId === product.id)?.quantity ?? 0
  const available = product.stock - inCart

  if (product.stock === 0) {
    return (
      <Button fullWidth disabled>
        Sin stock
      </Button>
    )
  }

  if (available <= 0) {
    return (
      <Alert type="info">
        Ya tenés en el carrito todas las unidades disponibles.{' '}
        <Link to="/cart" className="font-medium underline">
          Ver carrito
        </Link>
      </Alert>
    )
  }

  const safeQuantity = Math.min(quantity, available)

  function handleAdd() {
    addItem(product, safeQuantity)
    setQuantity(1)
    setAdded(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <QuantitySelector value={safeQuantity} onChange={setQuantity} max={available} />
        <Button onClick={handleAdd} className="flex-1">
          Agregar al carrito
        </Button>
      </div>

      {inCart > 0 && <p className="text-sm text-gray-600">Ya tenés {inCart} en el carrito.</p>}

      {added && (
        <Alert type="success">
          Producto agregado.{' '}
          <Link to="/cart" className="font-medium underline">
            Ver carrito
          </Link>
        </Alert>
      )}
    </div>
  )
}