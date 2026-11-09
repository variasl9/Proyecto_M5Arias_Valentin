import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { simulatePayment } from './paymentService'

describe('simulatePayment', () => {
  // Timers falsos: el test no espera 1,5 segundos reales
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('aprueba la tarjeta de prueba y guarda solo los últimos 4 dígitos', async () => {
    const payment = simulatePayment('4242 4242 4242 4242')
    await vi.advanceTimersByTimeAsync(1500)

    await expect(payment).resolves.toEqual({ method: 'card', last4: '4242', status: 'approved' })
  })

  it('rechaza las tarjetas que terminan en 0000', async () => {
    const payment = simulatePayment('4000 0000 0000 0000')
    // Registramos la expectativa ANTES de avanzar el tiempo, para que el rechazo no quede sin manejar
    const assertion = expect(payment).rejects.toThrow('El pago fue rechazado')
    await vi.advanceTimersByTimeAsync(1500)

    await assertion
  })

  it('no responde antes de terminar el procesamiento simulado', async () => {
    let settled = false
    void simulatePayment('4242 4242 4242 4242').then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(1000)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(500)
    expect(settled).toBe(true)
  })
})