import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrdersByStatus } from '../../components/admin/OrdersByStatus'
import { SalesChart } from '../../components/admin/SalesChart'
import { TopProductsList } from '../../components/admin/TopProductsList'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { useAllOrders } from '../../hooks/useAllOrders'
import { seedProducts } from '../../services/seedService'
import {
  getDailySales,
  getOrdersByStatus,
  getSalesSummary,
  getTopProducts,
} from '../../utils/analytics'
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
      <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
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
  const { orders, loading, error } = useAllOrders('')

  // Se recalculan solo cuando cambian las órdenes, no en cada render
  const summary = useMemo(() => getSalesSummary(orders), [orders])
  const dailySales = useMemo(() => getDailySales(orders, 14), [orders])
  const topProducts = useMemo(() => getTopProducts(orders, 5), [orders])
  const ordersByStatus = useMemo(() => getOrdersByStatus(orders), [orders])

  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSeed() {
    if (!window.confirm('¿Cargar productos de ejemplo en Firestore?')) return
    setSeeding(true)
    setMessage(null)
    try {
      const count = await seedProducts()
      setMessage({ type: 'success', text: `Se cargaron ${count} productos de ejemplo.` })
    } catch (err) {
      setMessage({ type: 'error', text: getFirebaseErrorMessage(err) })
    } finally {
      setSeeding(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Resumen</h1>

      {loading ? (
        <FullPageSpinner />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Órdenes totales" value={summary.totalOrders} to="/admin/orders" />
            <StatCard label="Pendientes" value={summary.pending} to="/admin/orders" />
            <StatCard label="Ingresos" value={formatPrice(summary.revenue)} />
            <StatCard label="Ticket promedio" value={formatPrice(summary.averageTicket)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SalesChart data={dailySales} />
            </div>
            <OrdersByStatus counts={ordersByStatus} />
          </div>

          <TopProductsList products={topProducts} />
        </>
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