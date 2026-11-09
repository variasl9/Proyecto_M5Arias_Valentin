import { screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { Timestamp } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { createOrder, subscribeToOrder } from '../../services/orderService'
import { simulatePayment } from '../../services/paymentService'
import { getProductById } from '../../services/productService'
import type { Order, Product } from '../../types'
import { AppError } from '../../utils/errors'
import { authenticatedAs, customerProfile, renderWithProviders } from '../test-utils'

// Mockeamos solo los "bordes" de la app: todo lo que habla con Firestore o con el pago
vi.mock('../../services/productService', () => ({
  subscribeToProducts: vi.fn(() => () => {}),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}))

vi.mock('../../services/orderService', () => ({
  createOrder: vi.fn(),
  subscribeToOrder: vi.fn(() => () => {}),
  subscribeToUserOrders: vi.fn(() => () => {}),
  subscribeToAllOrders: vi.fn(() => () => {}),
  updateOrderStatus: vi.fn(),
}))

vi.mock('../../services/paymentService', () => ({
  simulatePayment: vi.fn(),
}))

const product: Product = {
  id: 'p1',
  name: 'Campera Andes Pro',
  nameLower: 'campera andes pro',
  description: 'Campera impermeable y respirable.',
  price: 189000,
  category: 'Camperas',
  imageUrl: 'campera.jpg',
  stock: 5,
  createdAt: {} as Timestamp,
}

const placedOrder: Order = {
  id: 'order-123',
  userId: 'user-1',
  userEmail: 'cliente@test.com',
  items: [{ productId: 'p1', name: 'Campera Andes Pro', price: 189000, imageUrl: 'campera.jpg', quantity: 1 }],
  shipping: {
    fullName: 'Cliente Test',
    address: 'Av. Libertador 123',
    city: 'San Juan',
    postalCode: '5400',
    phone: '2644123456',
  },
  payment: { method: 'card', last4: '4242', status: 'approved' },
  total: 189000,
  status: 'pending',
  createdAt: { toDate: () => new Date(2026, 10, 9) } as unknown as Timestamp,
}

function renderStore() {
  return renderWithProviders(<App />, {
    auth: authenticatedAs(customerProfile),
    route: '/products/p1',
  })
}

/** Detalle → agregar → carrito → checkout → paso 2 */
async function addProductAndGoToCheckout(user: UserEvent) {
  await user.click(await screen.findByRole('button', { name: 'Agregar al carrito' }))
  await user.click(screen.getByRole('link', { name: 'Carrito, 1 productos' }))
  await user.click(screen.getByRole('link', { name: 'Continuar al checkout' }))
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
}

async function fillCheckoutForm(user: UserEvent, cardNumber = '4242424242424242') {
  // "Nombre completo" ya viene precargado con el nombre del perfil
  await user.type(screen.getByLabelText('Dirección'), 'Av. Libertador 123')
  await user.type(screen.getByLabelText('Ciudad'), 'San Juan')
  await user.type(screen.getByLabelText('Código postal'), '5400')
  await user.type(screen.getByLabelText('Teléfono'), '2644123456')
  await user.type(screen.getByLabelText('Número de tarjeta'), cardNumber)
  await user.type(screen.getByLabelText('Nombre en la tarjeta'), 'CLIENTE TEST')
  await user.type(screen.getByLabelText('Vencimiento'), '1299')
  await user.type(screen.getByLabelText('CVV'), '123')
}

beforeEach(() => {
  vi.mocked(getProductById).mockResolvedValue(product)
  vi.mocked(subscribeToOrder).mockImplementation((_orderId, onData) => {
    onData(placedOrder)
    return () => {}
  })
})

describe('Flujo de compra (integración)', () => {
  it('un cliente agrega un producto al carrito y completa la compra', async () => {
    vi.mocked(simulatePayment).mockResolvedValue({ method: 'card', last4: '4242', status: 'approved' })
    vi.mocked(createOrder).mockResolvedValue('order-123')
    const user = userEvent.setup()
    renderStore()

    await addProductAndGoToCheckout(user)
    await fillCheckoutForm(user)
    await user.click(screen.getByRole('button', { name: /pagar/i }))

    // Llega a la página de la orden con el mensaje de éxito
    expect(await screen.findByText(/gracias por tu compra/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Orden #ORDER-12' })).toBeInTheDocument()

    // El número de tarjeta llegó formateado mientras se tipeaba
    expect(simulatePayment).toHaveBeenCalledWith('4242 4242 4242 4242')

    // La orden se creó con los datos correctos
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        userEmail: 'cliente@test.com',
        items: [expect.objectContaining({ productId: 'p1', quantity: 1 })],
        payment: expect.objectContaining({ last4: '4242' }),
        shipping: expect.objectContaining({ city: 'San Juan', postalCode: '5400' }),
      }),
    )

    // Y el carrito quedó vacío
    expect(screen.getByRole('link', { name: 'Carrito, 0 productos' })).toBeInTheDocument()
  })

  it('no deja pagar con el formulario incompleto', async () => {
    const user = userEvent.setup()
    renderStore()

    await addProductAndGoToCheckout(user)
    await user.click(screen.getByRole('button', { name: /pagar/i }))

    expect(screen.getByText('Ingresá una dirección válida.')).toBeInTheDocument()
    expect(screen.getByText('El número de tarjeta no es válido.')).toBeInTheDocument()
    expect(simulatePayment).not.toHaveBeenCalled()
  })

  it('si el pago es rechazado muestra el error, no crea la orden y conserva el carrito', async () => {
    vi.mocked(simulatePayment).mockRejectedValue(
      new AppError('El pago fue rechazado. Probá con otra tarjeta.'),
    )
    const user = userEvent.setup()
    renderStore()

    await addProductAndGoToCheckout(user)
    await fillCheckoutForm(user, '4000000000000000')
    await user.click(screen.getByRole('button', { name: /pagar/i }))

    expect(
      await screen.findByText('El pago fue rechazado. Probá con otra tarjeta.'),
    ).toBeInTheDocument()
    expect(createOrder).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Carrito, 1 productos' })).toBeInTheDocument()
  })

  it('si otro cliente compró el stock antes, avisa sin vaciar el carrito', async () => {
    vi.mocked(simulatePayment).mockResolvedValue({ method: 'card', last4: '4242', status: 'approved' })
    vi.mocked(createOrder).mockRejectedValue(
      new AppError('"Campera Andes Pro" se quedó sin stock. Quitalo del carrito para continuar.'),
    )
    const user = userEvent.setup()
    renderStore()

    await addProductAndGoToCheckout(user)
    await fillCheckoutForm(user)
    await user.click(screen.getByRole('button', { name: /pagar/i }))

    expect(await screen.findByText(/se quedó sin stock/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Carrito, 1 productos' })).toBeInTheDocument()
  })
})