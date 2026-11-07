/**
 * Error con un mensaje pensado para mostrarle al usuario.
 * Lo usamos para errores de negocio: sin stock, pago rechazado, etc.
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppError'
  }
}