import { useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { seedProducts } from '../../services/seedService'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'

export function AdminDashboardPage() {
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSeed() {
    if (!window.confirm('¿Cargar productos de ejemplo en Firestore?')) return
    setSeeding(true)
    setMessage(null)
    try {
      const count = await seedProducts()
      setMessage({ type: 'success', text: `Se cargaron ${count} productos de ejemplo.` })
    } catch (error) {
      setMessage({ type: 'error', text: getFirebaseErrorMessage(error) })
    } finally {
      setSeeding(false)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
      <p className="text-gray-600">El CRUD de productos y la gestión de órdenes llegan en la Fase 6.</p>

      {/* Herramienta de desarrollo: no aparece en el build de producción */}
      {import.meta.env.DEV && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            <strong>Solo desarrollo:</strong> cargá productos de ejemplo para probar el catálogo.
          </p>
          {message && <Alert type={message.type}>{message.text}</Alert>}
          <Button onClick={() => void handleSeed()} isLoading={seeding} className="self-start">
            Cargar productos de ejemplo
          </Button>
        </div>
      )}
    </section>
  )
}