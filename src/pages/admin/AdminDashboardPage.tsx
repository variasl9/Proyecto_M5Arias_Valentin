import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useAllOrders } from '../../hooks/useAllOrders'
import { seedProducts } from '../../services/seedService'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { formatPrice } from '../../utils/format'

interface StatCardProps {
  label: string
  value: string | number
  to?: string
}

function StatCard({ label, value, to }: StatCardProps) {
  const content = (
    <>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </>
  )
  const classes = 'rounded-xl border border-gray-200 bg-white p-4'

  return to ? (
    <Link to={to} className={`${classes} transition hover:shadow-sm`}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}

export function AdminDashboardPage() {
  const { orders, loading } = useAllOrders('')
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const pending = orders.filter((o) => o.status === 'pending').length
  const processing = orders.filter((o) => o.status === 'processing').length
  // Ingresos: todo lo vendido, salvo lo cancelado
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

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
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Resumen</h1>

      {loading ? (
        <div className="py-6 text-indigo-600">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Órdenes totales" value={orders.length} to="/admin/orders" />
          <StatCard label="Pendientes" value={pending} to="/admin/orders" />
          <StatCard label="En preparación" value={processing} to="/admin/orders" />
          <StatCard label="Ingresos" value={formatPrice(revenue)} />
        </div>
      )}

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