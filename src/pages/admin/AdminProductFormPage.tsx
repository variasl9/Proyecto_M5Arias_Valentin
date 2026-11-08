import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from '../../components/admin/ProductForm'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { useProduct } from '../../hooks/useProduct'
import { createProduct, updateProduct } from '../../services/productService'
import { uploadProductImage } from '../../services/uploadService'
import type { ProductInput } from '../../types'
import { AppError } from '../../utils/errors'

const CARD_CLASSES = 'rounded-xl border border-gray-200 bg-white p-4 sm:p-6'
const PRODUCTS_PATH = '/admin/products'

/* ---------- Crear ---------- */

export function AdminNewProductPage() {
  const navigate = useNavigate()

  async function handleSubmit(input: ProductInput, imageFile: File | null) {
    if (!imageFile) throw new AppError('Subí una imagen del producto.')

    // 1) Subir la imagen a S3 (pasa por la Vercel Function)
    const imageUrl = await uploadProductImage(imageFile)
    // 2) Guardar el producto en Firestore con la URL pública
    await createProduct({ ...input, imageUrl })

    navigate(PRODUCTS_PATH, { state: { message: `Producto "${input.name}" creado.` } })
  }

  return (
    <section className="flex flex-col gap-6">
      <Link to={PRODUCTS_PATH} className="text-sm font-medium text-indigo-600 hover:underline">
        ← Productos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
      <div className={CARD_CLASSES}>
        <ProductForm
          submitLabel="Crear producto"
          onSubmit={handleSubmit}
          onCancel={() => navigate(PRODUCTS_PATH)}
        />
      </div>
    </section>
  )
}

/* ---------- Editar ---------- */

export function AdminEditProductPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { product, loading, error } = useProduct(id)

  if (loading) return <FullPageSpinner />
  if (error) return <Alert>{error}</Alert>
  if (!product) {
    return (
      <EmptyState
        title="Producto no encontrado"
        action={
          <Link to={PRODUCTS_PATH} className="font-medium text-indigo-600 hover:underline">
            Volver a productos
          </Link>
        }
      />
    )
  }

  async function handleSubmit(input: ProductInput, imageFile: File | null) {
    // Solo subimos una imagen nueva si el admin eligió otra
    const imageUrl = imageFile ? await uploadProductImage(imageFile) : input.imageUrl
    await updateProduct(id, { ...input, imageUrl })

    navigate(PRODUCTS_PATH, { state: { message: `Cambios guardados en "${input.name}".` } })
  }

  return (
    <section className="flex flex-col gap-6">
      <Link to={PRODUCTS_PATH} className="text-sm font-medium text-indigo-600 hover:underline">
        ← Productos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Editar producto</h1>
      <div className={CARD_CLASSES}>
        <ProductForm
          key={product.id}
          initialProduct={product}
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          onCancel={() => navigate(PRODUCTS_PATH)}
        />
      </div>
    </section>
  )
}