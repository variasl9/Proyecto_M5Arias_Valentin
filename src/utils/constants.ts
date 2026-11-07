export const PRODUCT_CATEGORIES = [
  'Camperas',
  'Calzado',
  'Mochilas',
  'Camping',
  'Accesorios',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]