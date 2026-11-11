import type { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import type { Order, OrderItem, OrderStatus } from '../types'
import { getDailySales, getOrdersByStatus, getSalesSummary, getTopProducts } from './analytics'

// Fecha fija: 11 de noviembre de 2026, 15 hs
const NOW = new Date(2026, 10, 11, 15)

function on(day: number): Timestamp {
  return { toDate: () => new Date(2026, 10, day, 12) } as unknown as Timestamp
}

const campera: OrderItem = { productId: 'p1', name: 'Campera', price: 100, imageUrl: 'c.jpg', quantity: 1 }
const botas: OrderItem = { productId: 'p2', name: 'Botas', price: 50, imageUrl: 'b.jpg', quantity: 1 }

function makeOrder(id: string, status: OrderStatus, createdAt: Timestamp, items: OrderItem[]): Order {
  return {
    id,
    userId: 'user-1',
    userEmail: 'cliente@test.com',
    items,
    shipping: { fullName: 'Cliente', address: 'Calle 1', city: 'San Juan', postalCode: '5400', phone: '2644123456' },
    payment: { method: 'card', last4: '4242', status: 'approved' },
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    status,
    createdAt,
  }
}

const orders: Order[] = [
  makeOrder('o1', 'completed', on(11), [{ ...campera, quantity: 2 }]), // 200, hoy
  makeOrder('o2', 'pending', on(11), [botas]), // 50, hoy
  makeOrder('o3', 'processing', on(9), [campera, { ...botas, quantity: 3 }]), // 250, hace 2 días
  makeOrder('o4', 'cancelled', on(10), [{ ...campera, quantity: 5 }]), // cancelada: no cuenta
]

describe('getDailySales', () => {
  it('devuelve un punto por día, terminando hoy', () => {
    const data = getDailySales([], 14, NOW)
    expect(data).toHaveLength(14)
    expect(data.at(-1)?.date).toBe('2026-11-11')
    expect(data.at(0)?.date).toBe('2026-10-29')
  })

  it('completa con 0 los días sin ventas', () => {
    expect(getDailySales([], 14, NOW).every((d) => d.revenue === 0)).toBe(true)
  })

  it('suma los ingresos por día y excluye las canceladas', () => {
    const data = getDailySales(orders, 14, NOW)
    expect(data.find((d) => d.date === '2026-11-11')).toMatchObject({ revenue: 250, orders: 2 })
    expect(data.find((d) => d.date === '2026-11-09')).toMatchObject({ revenue: 250, orders: 1 })
    expect(data.find((d) => d.date === '2026-11-10')).toMatchObject({ revenue: 0, orders: 0 })
  })

  it('ignora las órdenes fuera del período', () => {
    const old = makeOrder('o5', 'completed', on(1), [campera])
    const total = getDailySales([old], 7, NOW).reduce((sum, d) => sum + d.revenue, 0)
    expect(total).toBe(0)
  })
})

describe('getTopProducts', () => {
  it('ordena por unidades vendidas y excluye las canceladas', () => {
    expect(getTopProducts(orders)).toEqual([
      { productId: 'p2', name: 'Botas', units: 4, revenue: 200 },
      { productId: 'p1', name: 'Campera', units: 3, revenue: 300 },
    ])
  })

  it('respeta el límite', () => {
    expect(getTopProducts(orders, 1)).toHaveLength(1)
  })
})

describe('getSalesSummary', () => {
  it('calcula totales, pendientes, ingresos y ticket promedio', () => {
    expect(getSalesSummary(orders)).toEqual({
      totalOrders: 4,
      pending: 1,
      revenue: 500,
      averageTicket: 500 / 3,
    })
  })

  it('sin órdenes, el ticket promedio es 0 (no divide por cero)', () => {
    expect(getSalesSummary([]).averageTicket).toBe(0)
  })
})

describe('getOrdersByStatus', () => {
  it('cuenta las órdenes de cada estado', () => {
    expect(getOrdersByStatus(orders)).toEqual({ pending: 1, processing: 1, completed: 1, cancelled: 1 })
  })
})