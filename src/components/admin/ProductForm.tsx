import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Product, ProductInput } from '../../types'
import { PRODUCT_CATEGORIES } from '../../utils/constants'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import {
  validateProductForm,
  type ProductFormField,
  type ProductFormValues,
} from '../../utils/productValidators'
import { hasErrors, type FieldErrors } from '../../utils/validators'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { ImageUploader } from './ImageUploader'

interface ProductFormProps {
  initialProduct?: Product
  submitLabel: string
  /** El padre decide qué hacer: subir la imagen y crear o actualizar el producto */
  onSubmit: (input: ProductInput, imageFile: File | null) => Promise<void>
  onCancel: () => void
}

function toFormValues(product?: Product): ProductFormValues {
  if (!product) {
    return { name: '', description: '', price: '', stock: '', category: '' }
  }
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
    category: product.category,
  }
}

export function ProductForm({ initialProduct, submitLabel, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() => toFormValues(initialProduct))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors<ProductFormField>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const hasImage = imageFile !== null || Boolean(initialProduct?.imageUrl)
    const validation = validateProductForm(values, hasImage)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSaving(true)
    setSubmitError(null)
    try {
      await onSubmit(
        {
          name: values.name.trim(),
          description: values.description.trim(),
          price: Number(values.price),
          stock: Number(values.stock),
          category: values.category,
          imageUrl: initialProduct?.imageUrl ?? '',
        },
        imageFile,
      )
      // Si sale bien, el padre navega a otra página: no hace falta resetear nada
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {submitError && <Alert>{submitError}</Alert>}

      <fieldset disabled={saving} className="flex flex-col gap-5">
        <Input label="Nombre" name="name" value={values.name} onChange={handleChange} error={errors.name} />

        <Textarea
          label="Descripción"
          name="description"
          value={values.description}
          onChange={handleChange}
          error={errors.description}
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Precio (ARS)"
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={values.price}
            onChange={handleChange}
            error={errors.price}
          />
          <Input
            label="Stock"
            name="stock"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={values.stock}
            onChange={handleChange}
            error={errors.stock}
          />
          <Select
            label="Categoría"
            name="category"
            options={PRODUCT_CATEGORIES}
            placeholder="Elegí una..."
            value={values.category}
            onChange={handleChange}
            error={errors.category}
          />
        </div>

        <ImageUploader
          currentUrl={initialProduct?.imageUrl}
          onFileChange={setImageFile}
          error={errors.image}
          disabled={saving}
        />
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={saving}>
          {saving ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}