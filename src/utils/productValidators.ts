import { PRODUCT_CATEGORIES } from './constants'
import type { FieldErrors } from './validators'

/** Los inputs siempre devuelven texto: precio y stock se convierten al guardar */
export interface ProductFormValues {
  name: string
  description: string
  price: string
  stock: string
  category: string
}

export type ProductFormField = keyof ProductFormValues | 'image'

export function validateProductForm(
  values: ProductFormValues,
  hasImage: boolean,
): FieldErrors<ProductFormField> {
  const errors: FieldErrors<ProductFormField> = {}

  const name = values.name.trim()
  if (name.length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.'
  else if (name.length > 80) errors.name = 'El nombre no puede superar los 80 caracteres.'

  const description = values.description.trim()
  if (description.length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres.'
  } else if (description.length > 500) {
    errors.description = 'La descripción no puede superar los 500 caracteres.'
  }

  const price = Number(values.price)
  if (values.price.trim() === '' || !Number.isFinite(price) || price <= 0) {
    errors.price = 'Ingresá un precio mayor a 0.'
  }

  const stock = Number(values.stock)
  if (values.stock.trim() === '' || !Number.isInteger(stock) || stock < 0) {
    errors.stock = 'El stock debe ser un número entero de 0 o más.'
  }

  if (!(PRODUCT_CATEGORIES as readonly string[]).includes(values.category)) {
    errors.category = 'Elegí una categoría.'
  }

  if (!hasImage) errors.image = 'Subí una imagen del producto.'

  return errors
}