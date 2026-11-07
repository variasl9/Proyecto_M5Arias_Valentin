import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { OrderItemsList } from '../components/orders/OrderItemsList'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { createOrder } from '../services/orderService'
import { simulatePayment } from '../services/paymentService'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import { formatCardNumber, formatExpiry, formatPrice } from '../utils/format'
import {
  hasErrors,
  validateCheckout,
  type CheckoutValues,
  type FieldErrors,
} from '../utils/validators'

type Step = 'review' | 'details'

const INITIAL_VALUES: CheckoutValues = {
  fullName: '',
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  cardNumber: '',
  cardHolder: '',
  cardExpiry: '',
  cardCvv: '',
}

/** Da formato mientras el usuario escribe */
function formatField(name: keyof CheckoutValues, value: string): string {
  switch (name) {
    case 'cardNumber':
      return formatCardNumber(value)
    case 'cardExpiry':
      return formatExpiry(value)
    case 'cardCvv':
      return value.replace(/\D/g, '').slice(0, 4)
    default:
      return value
  }
}

const CARD_CLASSES = 'rounded-xl border border-gray-200 bg-white p-4'

export function CheckoutPage() {
  const { profile } = useAuth()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('review')
  const [values, setValues] = useState<CheckoutValues>(() => ({
    ...INITIAL_VALUES,
    fullName: profile?.displayName ?? '',
  }))
  const [errors, setErrors] = useState<FieldErrors<keyof CheckoutValues>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Sin productos no hay nada que pagar
  if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as keyof CheckoutValues
    const value = formatField(name, event.target.value)
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return

    const validation = validateCheckout(values)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSubmitError(null)
    setSubmitting(true)

    try {
      // 1) Autorizar el pago (simulado)
      const payment = await simulatePayment(values.cardNumber)

      // 2) Crear la orden y descontar stock en una transacción
      const orderId = await createOrder({
        userId: profile.uid,
        userEmail: profile.email,
        items,
        payment,
        shipping: {
          fullName: values.fullName.trim(),
          address: values.address.trim(),
          city: values.city.trim(),
          postalCode: values.postalCode.trim(),
          phone: values.phone.trim(),
        },
      })

      // 3) Primero navegamos y después vaciamos el carrito
      navigate(`/orders/${orderId}`, { replace: true, state: { justPlaced: true } })
      clearCart()
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <ol className="mt-3 flex gap-2 text-sm">
          <li className={step === 'review' ? 'font-semibold text-indigo-600' : 'text-gray-500'}>
            1. Revisión
          </li>
          <li className="text-gray-300">›</li>
          <li className={step === 'details' ? 'font-semibold text-indigo-600' : 'text-gray-500'}>
            2. Envío y pago
          </li>
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {step === 'review' ? (
          <div className={`${CARD_CLASSES} flex flex-col gap-4`}>
            <h2 className="text-lg font-semibold text-gray-900">Revisá tu pedido</h2>
            <OrderItemsList items={items} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/cart" className="text-center text-sm font-medium text-indigo-600 hover:underline">
                Modificar carrito
              </Link>
              <Button onClick={() => setStep('details')}>Continuar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            {submitError && <Alert>{submitError}</Alert>}

            <div className={CARD_CLASSES}>
              <fieldset disabled={submitting} className="flex flex-col gap-4">
                <legend className="mb-4 text-lg font-semibold text-gray-900">Datos de envío</legend>
                <Input label="Nombre completo" name="fullName" autoComplete="name"
                  value={values.fullName} onChange={handleChange} error={errors.fullName} />
                <Input label="Dirección" name="address" autoComplete="street-address"
                  value={values.address} onChange={handleChange} error={errors.address} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Ciudad" name="city" autoComplete="address-level2"
                    value={values.city} onChange={handleChange} error={errors.city} />
                  <Input label="Código postal" name="postalCode" autoComplete="postal-code"
                    value={values.postalCode} onChange={handleChange} error={errors.postalCode} />
                </div>
                <Input label="Teléfono" name="phone" type="tel" autoComplete="tel"
                  value={values.phone} onChange={handleChange} error={errors.phone} />
              </fieldset>
            </div>

            <div className={CARD_CLASSES}>
              <fieldset disabled={submitting} className="flex flex-col gap-4">
                <legend className="mb-4 text-lg font-semibold text-gray-900">Pago</legend>
                <Alert type="info">
                  <strong>Pago simulado.</strong> Usá <code>4242 4242 4242 4242</code> para un pago
                  aprobado, o cualquier número que termine en <code>0000</code> para uno rechazado.
                </Alert>
                <Input label="Número de tarjeta" name="cardNumber" inputMode="numeric"
                  autoComplete="cc-number" placeholder="0000 0000 0000 0000"
                  value={values.cardNumber} onChange={handleChange} error={errors.cardNumber} />
                <Input label="Nombre en la tarjeta" name="cardHolder" autoComplete="cc-name"
                  value={values.cardHolder} onChange={handleChange} error={errors.cardHolder} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Vencimiento" name="cardExpiry" inputMode="numeric"
                    autoComplete="cc-exp" placeholder="MM/AA"
                    value={values.cardExpiry} onChange={handleChange} error={errors.cardExpiry} />
                  <Input label="CVV" name="cardCvv" type="password" inputMode="numeric"
                    autoComplete="cc-csc" placeholder="123"
                    value={values.cardCvv} onChange={handleChange} error={errors.cardCvv} />
                </div>
              </fieldset>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="ghost" onClick={() => setStep('review')} disabled={submitting}>
                Volver
              </Button>
              <Button type="submit" isLoading={submitting}>
                {submitting ? 'Procesando pago...' : `Pagar ${formatPrice(totalPrice)}`}
              </Button>
            </div>
          </form>
        )}

        <aside className={`${CARD_CLASSES} flex flex-col gap-3 lg:sticky lg:top-20`}>
          <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Productos ({totalItems})</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Envío</span>
            <span className="font-medium text-green-700">Gratis</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </aside>
      </div>
    </section>
  )
}