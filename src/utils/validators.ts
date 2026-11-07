export type FieldErrors<T extends string> = Partial<Record<T, string>>

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

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}