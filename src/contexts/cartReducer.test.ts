import { describe, expect, it } from 'vitest'
import type { CartItem } from '../types'
import {
  cartReducer,
  getCartCount,
  getCartTotal,
  initialCartState,
  mergeCartItems,
  type CartAction,
  type CartState,
  type NewCartItem,
} from './cartReducer'

const campera: NewCartItem = {
  productId: 'p1',
  name: 'Campera',
  price: 100,
  imageUrl: 'campera.jpg',
  stock: 5,
}

const botas: NewCartItem = {
  productId: 'p2',
  name: 'Botas',
  price: 50,
  imageUrl: 'botas.jpg',
  stock: 2,
}

function item(base: NewCartItem, quantity: number): CartItem {
  return { ...base, quantity }
}

function stateWith(...items: CartItem[]): CartState {
  return { items }
}

/** Congela el estado: si el reducer intentara modificarlo, el test fallaría con un TypeError */
function freeze(state: CartState): CartState {
  state.items.forEach((i) => Object.freeze(i))
  Object.freeze(state.items)
  return Object.freeze(state)
}

describe('cartReducer', () => {
  describe('ADD_ITEM', () => {
    it('agrega un producto nuevo con cantidad 1 por defecto', () => {
      const next = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: { item: campera } })
      expect(next.items).toEqual([item(campera, 1)])
    })

    it('agrega la cantidad indicada', () => {
      const next = cartReducer(initialCartState, {
        type: 'ADD_ITEM',
        payload: { item: campera, quantity: 3 },
      })
      expect(next.items[0].quantity).toBe(3)
    })

    it('suma la cantidad si el producto ya estaba en el carrito', () => {
      const next = cartReducer(stateWith(item(campera, 2)), {
        type: 'ADD_ITEM',
        payload: { item: campera, quantity: 2 },
      })
      expect(next.items).toHaveLength(1)
      expect(next.items[0].quantity).toBe(4)
    })

    it('no supera el stock al sumar a un producto existente', () => {
      const next = cartReducer(stateWith(item(campera, 4)), {
        type: 'ADD_ITEM',
        payload: { item: campera, quantity: 3 },
      })
      expect(next.items[0].quantity).toBe(5)
    })

    it('no supera el stock al agregar un producto nuevo', () => {
      const next = cartReducer(initialCartState, {
        type: 'ADD_ITEM',
        payload: { item: botas, quantity: 10 },
      })
      expect(next.items[0].quantity).toBe(2)
    })

    it('ignora productos sin stock', () => {
      const state = stateWith(item(campera, 1))
      const next = cartReducer(state, {
        type: 'ADD_ITEM',
        payload: { item: { ...botas, stock: 0 } },
      })
      expect(next).toBe(state)
    })

    it('ignora cantidades 0 o negativas', () => {
      const state = stateWith(item(campera, 1))
      expect(cartReducer(state, { type: 'ADD_ITEM', payload: { item: campera, quantity: 0 } })).toBe(state)
      expect(cartReducer(state, { type: 'ADD_ITEM', payload: { item: campera, quantity: -1 } })).toBe(state)
    })

    it('actualiza precio y stock si cambiaron desde que se agregó', () => {
      const next = cartReducer(stateWith(item(campera, 1)), {
        type: 'ADD_ITEM',
        payload: { item: { ...campera, price: 120, stock: 10 } },
      })
      expect(next.items[0]).toEqual({ ...campera, price: 120, stock: 10, quantity: 2 })
    })

    it('no modifica el estado anterior (inmutabilidad)', () => {
      const state = freeze(stateWith(item(campera, 1)))
      expect(() =>
        cartReducer(state, { type: 'ADD_ITEM', payload: { item: campera } }),
      ).not.toThrow()
      expect(state.items[0].quantity).toBe(1)
    })
  })

  describe('REMOVE_ITEM', () => {
    it('quita el producto indicado', () => {
      const next = cartReducer(stateWith(item(campera, 1), item(botas, 1)), {
        type: 'REMOVE_ITEM',
        payload: { productId: 'p1' },
      })
      expect(next.items).toEqual([item(botas, 1)])
    })

    it('no cambia nada si el producto no está en el carrito', () => {
      const next = cartReducer(stateWith(item(campera, 1)), {
        type: 'REMOVE_ITEM',
        payload: { productId: 'no-existe' },
      })
      expect(next.items).toEqual([item(campera, 1)])
    })
  })

  describe('UPDATE_QUANTITY', () => {
    it('cambia la cantidad de un producto', () => {
      const next = cartReducer(stateWith(item(campera, 1)), {
        type: 'UPDATE_QUANTITY',
        payload: { productId: 'p1', quantity: 3 },
      })
      expect(next.items[0].quantity).toBe(3)
    })

    it('limita la cantidad al stock disponible', () => {
      const next = cartReducer(stateWith(item(campera, 1)), {
        type: 'UPDATE_QUANTITY',
        payload: { productId: 'p1', quantity: 99 },
      })
      expect(next.items[0].quantity).toBe(5)
    })

    it('quita el producto si la cantidad es 0 o negativa', () => {
      const state = stateWith(item(campera, 2), item(botas, 1))
      expect(
        cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { productId: 'p1', quantity: 0 } }).items,
      ).toEqual([item(botas, 1)])
      expect(
        cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { productId: 'p1', quantity: -2 } }).items,
      ).toEqual([item(botas, 1)])
    })

    it('no modifica el estado anterior (inmutabilidad)', () => {
      const state = freeze(stateWith(item(campera, 1)))
      cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { productId: 'p1', quantity: 3 } })
      expect(state.items[0].quantity).toBe(1)
    })
  })

  describe('CLEAR_CART', () => {
    it('vacía el carrito', () => {
      const next = cartReducer(stateWith(item(campera, 2), item(botas, 1)), { type: 'CLEAR_CART' })
      expect(next).toEqual({ items: [] })
    })
  })

  describe('MERGE_CART', () => {
    it('fusiona el carrito local con el de la nube sumando cantidades', () => {
      const next = cartReducer(stateWith(item(campera, 2)), {
        type: 'MERGE_CART',
        payload: { items: [item(campera, 1), item(botas, 1)] },
      })
      expect(next.items).toHaveLength(2)
      expect(next.items.find((i) => i.productId === 'p1')?.quantity).toBe(3)
      expect(next.items.find((i) => i.productId === 'p2')?.quantity).toBe(1)
    })

    it('al fusionar tampoco supera el stock', () => {
      const next = cartReducer(stateWith(item(campera, 4)), {
        type: 'MERGE_CART',
        payload: { items: [item(campera, 3)] },
      })
      expect(next.items[0].quantity).toBe(5)
    })
  })

  it('devuelve el mismo estado ante una acción desconocida', () => {
    const state = stateWith(item(campera, 1))
    const next = cartReducer(state, { type: 'ACCION_INEXISTENTE' } as unknown as CartAction)
    expect(next).toBe(state)
  })
})

describe('mergeCartItems', () => {
  it('con los dos carritos vacíos devuelve un carrito vacío', () => {
    expect(mergeCartItems([], [])).toEqual([])
  })

  it('si el local está vacío, conserva el de la nube', () => {
    expect(mergeCartItems([], [item(botas, 1)])).toEqual([item(botas, 1)])
  })
})

describe('selectores', () => {
  it('getCartTotal suma precio × cantidad', () => {
    expect(getCartTotal([item(campera, 2), item(botas, 1)])).toBe(250)
  })

  it('getCartCount suma las unidades', () => {
    expect(getCartCount([item(campera, 2), item(botas, 1)])).toBe(3)
  })

  it('con el carrito vacío ambos devuelven 0', () => {
    expect(getCartTotal([])).toBe(0)
    expect(getCartCount([])).toBe(0)
  })
})