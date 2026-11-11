import type { Order, OrderStatus } from '../types'

export interface DailySales {
  date: string // 'AAAA-MM-DD'
  label: string // 'DD/MM' para el eje
  revenue: number
  orders: number
}

export interface ProductSales {
  productId: string
  name: string
  units: number
  revenue: number
}

export interface SalesSummary {
  totalOrders: number
  pending: number
  revenue: number
  averageTicket: number
}

/** Las órdenes canceladas no cuentan como ventas */
function isSale(order: Order): boolean {
  return order.status !== 'cancelled'
}

function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const dayLabelFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' })

/**
 * Ingresos por día de los últimos `days` días, terminando hoy.
 * Los días sin ventas aparecen en 0: si se omitieran, el gráfico engañaría.
 * `now` es un parámetro para poder testear con una fecha fija.
 */
export function getDailySales(orders: Order[], days = 14, now: Date = new Date()): DailySales[] {
  const buckets = new Map<string, DailySales>()

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const key = toDayKey(date)
    buckets.set(key, { date: key, label: dayLabelFormatter.format(date), revenue: 0, orders: 0 })
  }

  for (const order of orders) {
    if (!isSale(order) || !order.createdAt) continue
    const bucket = buckets.get(toDayKey(order.createdAt.toDate()))
    if (bucket) {
      bucket.revenue += order.total
      bucket.orders += 1
    }
  }

  return [...buckets.values()]
}

/** Productos más vendidos por unidades (a igual cantidad, por ingresos) */
export function getTopProducts(orders: Order[], limit = 5): ProductSales[] {
  const totals = new Map<string, ProductSales>()

  for (const order of orders) {
    if (!isSale(order)) continue
    for (const item of order.items) {
      const current = totals.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        units: 0,
        revenue: 0,
      }
      current.units += item.quantity
      current.revenue += item.price * item.quantity
      totals.set(item.productId, current)
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, limit)
}

export function getSalesSummary(orders: Order[]): SalesSummary {
  const sales = orders.filter(isSale)
  const revenue = sales.reduce((sum, order) => sum + order.total, 0)

  return {
    totalOrders: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    revenue,
    averageTicket: sales.length > 0 ? revenue / sales.length : 0,
  }
}

export function getOrdersByStatus(orders: Order[]): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  }
  for (const order of orders) counts[order.status] += 1
  return counts
}