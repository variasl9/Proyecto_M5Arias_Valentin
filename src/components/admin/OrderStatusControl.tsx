import { useState } from 'react'
import { updateOrderStatus } from '../../services/orderService'
import type { Order, OrderStatus } from '../../types'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from '../../utils/orderStatus'
import { Button } from '../ui/Button'

interface OrderStatusControlProps {
  order: Order
}

export function OrderStatusControl({ order }: OrderStatusControlProps) {
  const [selected, setSelected] = useState<OrderStatus | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Solo ofrecemos los estados a los que se puede pasar desde el actual
  const nextStatuses = ORDER_TRANSITIONS[order.status]

  if (nextStatuses.length === 0) {
    return <p className="text-xs text-gray-500">Estado final: no se puede modificar.</p>
  }

  async function handleUpdate() {
    if (!selected) return
    if (
      selected === 'cancelled' &&
      !window.confirm('¿Cancelar esta orden? El stock se devolverá a los productos.')
    ) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      await updateOrderStatus(order.id, selected)
    } catch (err) {
      setError(getFirebaseErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <label htmlFor={`status-${order.id}`} className="sr-only">
          Nuevo estado
        </label>
        <select
          id={`status-${order.id}`}
          value={selected}
          onChange={(e) => setSelected(e.target.value as OrderStatus | '')}
          disabled={saving}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">Cambiar estado…</option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <Button
          variant={selected === 'cancelled' ? 'danger' : 'primary'}
          onClick={() => void handleUpdate()}
          disabled={!selected}
          isLoading={saving}
        >
          Aplicar
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}