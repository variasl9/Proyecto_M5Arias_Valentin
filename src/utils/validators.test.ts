import { describe, expect, it } from 'vitest'
import { validateProductForm } from './productValidators'
import {
  hasErrors,
  validateCheckout,
  validateLogin,
  validateRegister,
  type CheckoutValues,
} from './validators'

// Fecha fija: el test da el mismo resultado hoy y dentro de 5 años
const NOW = new Date(2026, 10, 7) // 7 de noviembre de 2026

const validCheckout: CheckoutValues = {
  fullName: 'Valentín Arias',
  address: 'Av. Libertador 123',
  city: 'San Juan',
  postalCode: '5400',
  phone: '264 412-3456',
  cardNumber: '4242 4242 4242 4242',
  cardHolder: 'VALENTIN ARIAS',
  cardExpiry: '12/28',
  cardCvv: '123',
}

describe('validateCheckout', () => {
  it('no devuelve errores con datos válidos', () => {
    expect(validateCheckout(validCheckout, NOW)).toEqual({})
  })

  it('con todo vacío marca los 9 campos', () => {
    const empty = Object.fromEntries(
      Object.keys(validCheckout).map((key) => [key, '']),
    ) as unknown as CheckoutValues
    expect(Object.keys(validateCheckout(empty, NOW))).toHaveLength(9)
  })

  it('rechaza una tarjeta vencida', () => {
    const errors = validateCheckout({ ...validCheckout, cardExpiry: '10/26' }, NOW)
    expect(errors.cardExpiry).toBe('La tarjeta está vencida.')
  })

  it('acepta una tarjeta que vence este mes (sirve hasta el último día)', () => {
    expect(validateCheckout({ ...validCheckout, cardExpiry: '11/26' }, NOW).cardExpiry).toBeUndefined()
  })

  it('rechaza un vencimiento con formato inválido', () => {
    expect(validateCheckout({ ...validCheckout, cardExpiry: '13/27' }, NOW).cardExpiry).toBe(
      'Usá el formato MM/AA.',
    )
  })

  it('rechaza números de tarjeta demasiado cortos', () => {
    expect(validateCheckout({ ...validCheckout, cardNumber: '4242' }, NOW).cardNumber).toBeDefined()
  })

  it('rechaza un CVV con letras', () => {
    expect(validateCheckout({ ...validCheckout, cardCvv: '12a' }, NOW).cardCvv).toBe('CVV inválido.')
  })

  it('rechaza un teléfono con menos de 8 dígitos', () => {
    expect(validateCheckout({ ...validCheckout, phone: '123-45' }, NOW).phone).toBeDefined()
  })
})

describe('validateLogin', () => {
  it('rechaza un email inválido', () => {
    expect(validateLogin({ email: 'no-es-un-email', password: 'x' }).email).toBe('El email no es válido.')
  })

  it('pide la contraseña', () => {
    expect(validateLogin({ email: 'a@b.com', password: '' }).password).toBeDefined()
  })
})

describe('validateRegister', () => {
  const valid = {
    displayName: 'Valentín',
    email: 'valentin@test.com',
    password: 'secreta',
    confirmPassword: 'secreta',
  }

  it('no devuelve errores con datos válidos', () => {
    expect(hasErrors(validateRegister(valid))).toBe(false)
  })

  it('detecta contraseñas que no coinciden', () => {
    expect(validateRegister({ ...valid, confirmPassword: 'otra' }).confirmPassword).toBe(
      'Las contraseñas no coinciden.',
    )
  })

  it('exige al menos 6 caracteres de contraseña', () => {
    const errors = validateRegister({ ...valid, password: '123', confirmPassword: '123' })
    expect(errors.password).toBeDefined()
  })
})

describe('validateProductForm', () => {
  const valid = {
    name: 'Campera Andes',
    description: 'Campera impermeable para trekking',
    price: '1500.50',
    stock: '10',
    category: 'Camperas',
  }

  it('no devuelve errores con datos válidos e imagen', () => {
    expect(validateProductForm(valid, true)).toEqual({})
  })

  it('exige una imagen', () => {
    expect(validateProductForm(valid, false).image).toBeDefined()
  })

  it('rechaza precio 0 y stock con decimales', () => {
    const errors = validateProductForm({ ...valid, price: '0', stock: '1.5' }, true)
    expect(errors.price).toBeDefined()
    expect(errors.stock).toBeDefined()
  })

  it('rechaza una categoría que no existe', () => {
    expect(validateProductForm({ ...valid, category: 'Inventada' }, true).category).toBeDefined()
  })
})