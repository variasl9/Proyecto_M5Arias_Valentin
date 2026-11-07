import type { Timestamp } from 'firebase/firestore'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatPrice(value: number): string {
  return priceFormatter.format(value)
}

export function formatDate(timestamp: Timestamp | null | undefined): string {
  return timestamp ? dateFormatter.format(timestamp.toDate()) : '—'
}

/** Muestra un ID corto y legible: "#A1B2C3D4" */
export function formatOrderId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`
}

/** "4242424242424242" → "4242 4242 4242 4242" */
export function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** "1228" → "12/28" */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}