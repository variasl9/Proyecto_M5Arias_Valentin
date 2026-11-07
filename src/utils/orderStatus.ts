import type { OrderStatus } from '../types'

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled']

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  processing: 'En preparación',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

/** Desde cada estado, a cuáles se puede pasar. Las reglas de Firestore aplican lo mismo. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to)
}