export type FieldErrors<T extends string> = Partial<Record<T, string>>

/* ---------- Login y registro ---------- */

export interface LoginValues {
  email: string
  password: string
}

export interface RegisterValues extends LoginValues {
  displayName: string
  confirmPassword: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Ingresá tu email.'
  if (!EMAIL_REGEX.test(email.trim())) return 'El email no es válido.'
  return undefined
}

export function validateLogin(values: LoginValues): FieldErrors<keyof LoginValues> {
  const errors: FieldErrors<keyof LoginValues> = {}

  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError

  if (!values.password) errors.password = 'Ingresá tu contraseña.'

  return errors
}

export function validateRegister(values: RegisterValues): FieldErrors<keyof RegisterValues> {
  const errors: FieldErrors<keyof RegisterValues> = {}

  if (values.displayName.trim().length < 2) {
    errors.displayName = 'Ingresá tu nombre (mínimo 2 caracteres).'
  }

  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError

  if (values.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  return errors
}

/* ---------- Checkout ---------- */

export interface ShippingValues {
  fullName: string
  address: string
  city: string
  postalCode: string
  phone: string
}

export interface CardValues {
  cardNumber: string
  cardHolder: string
  cardExpiry: string
  cardCvv: string
}

export type CheckoutValues = ShippingValues & CardValues

function validateExpiry(expiry: string, now: Date): string | undefined {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry)
  if (!match) return 'Usá el formato MM/AA.'

  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  // La tarjeta sirve hasta el último día de ese mes:
  // new Date(año, mes, 1) con el mes en base 1 da el primer día del mes SIGUIENTE
  const firstDayAfterExpiry = new Date(year, month, 1)

  if (firstDayAfterExpiry <= now) return 'La tarjeta está vencida.'
  return undefined
}

/** `now` es un parámetro para poder testear con una fecha fija */
export function validateCheckout(
  values: CheckoutValues,
  now: Date = new Date(),
): FieldErrors<keyof CheckoutValues> {
  const errors: FieldErrors<keyof CheckoutValues> = {}

  // Envío
  if (values.fullName.trim().length < 3) errors.fullName = 'Ingresá tu nombre completo.'
  if (values.address.trim().length < 5) errors.address = 'Ingresá una dirección válida.'
  if (values.city.trim().length < 2) errors.city = 'Ingresá tu ciudad.'
  if (!/^[A-Za-z0-9]{4,8}$/.test(values.postalCode.trim())) {
    errors.postalCode = 'Código postal inválido (ej: 5400).'
  }
  if (values.phone.replace(/\D/g, '').length < 8) errors.phone = 'Ingresá un teléfono válido.'

  // Tarjeta
  const cardDigits = values.cardNumber.replace(/\D/g, '')
  if (cardDigits.length < 13 || cardDigits.length > 19) {
    errors.cardNumber = 'El número de tarjeta no es válido.'
  }
  if (values.cardHolder.trim().length < 3) {
    errors.cardHolder = 'Ingresá el nombre como figura en la tarjeta.'
  }
  const expiryError = validateExpiry(values.cardExpiry, now)
  if (expiryError) errors.cardExpiry = expiryError
  if (!/^\d{3,4}$/.test(values.cardCvv)) errors.cardCvv = 'CVV inválido.'

  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}