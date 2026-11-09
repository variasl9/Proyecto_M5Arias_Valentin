import { describe, expect, it } from 'vitest'
import type { OrderStatus } from '../types'
import { canTransition, ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from './orderStatus'

describe('canTransition', () => {
  const cases: [OrderStatus, OrderStatus, boolean][] = [
    ['pending', 'processing', true],
    ['pending', 'cancelled', true],
    ['pending', 'completed', false], // no se puede saltear la preparación
    ['processing', 'completed', true],
    ['processing', 'cancelled', true],
    ['processing', 'pending', false], // no se vuelve atrás
    ['completed', 'cancelled', false], // completada es final
    ['cancelled', 'pending', false], // cancelada es final
  ]

  it.each(cases)('de %s a %s → %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected)
  })
})

describe('estados de orden', () => {
  it('completed y cancelled son estados finales', () => {
    expect(ORDER_TRANSITIONS.completed).toEqual([])
    expect(ORDER_TRANSITIONS.cancelled).toEqual([])
  })

  it('todos los estados tienen etiqueta en español', () => {
    ORDER_STATUSES.forEach((status) => {
      expect(ORDER_STATUS_LABELS[status]).toBeTruthy()
    })
  })
})