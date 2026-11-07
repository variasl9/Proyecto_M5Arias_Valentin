import type { PaymentInfo } from '../types'
import { AppError } from '../utils/errors'

const SIMULATED_DELAY_MS = 1500

/**
 * Simula la autorización de un pago con tarjeta.
 * NO se conecta con ninguna pasarela real (la consigna pide solo simulación).
 *
 * Tarjetas de prueba:
 *  - 4242 4242 4242 4242 → aprobada
 *  - cualquier número que termine en 0000 → rechazada
 */
export async function simulatePayment(cardNumber: string): Promise<PaymentInfo> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))

  const digits = cardNumber.replace(/\D/g, '')

  if (digits.endsWith('0000')) {
    throw new AppError('El pago fue rechazado. Probá con otra tarjeta.')
  }

  return { method: 'card', last4: digits.slice(-4), status: 'approved' }
}