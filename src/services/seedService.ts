import { createProduct } from './productService'
import type { ProductInput } from '../types'

const image = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`

const SAMPLE_PRODUCTS: ProductInput[] = [
  { name: 'Campera Andes Pro', description: 'Campera impermeable y respirable para trekking en clima frío.', price: 189000, stock: 12, category: 'Camperas', imageUrl: image('andes-pro') },
  { name: 'Campera Fitz Roy Liviana', description: 'Rompevientos liviana que se guarda en su propio bolsillo.', price: 98000, stock: 20, category: 'Camperas', imageUrl: image('fitz-roy') },
  { name: 'Campera de Pluma Torres', description: 'Abrigo de pluma de ganso para temperaturas bajo cero.', price: 245000, stock: 5, category: 'Camperas', imageUrl: image('torres') },
  { name: 'Botas Trekking Lanín', description: 'Botas de caña media con suela antideslizante y membrana impermeable.', price: 165000, stock: 8, category: 'Calzado', imageUrl: image('lanin') },
  { name: 'Zapatillas Trail Chaltén', description: 'Zapatillas livianas para trail running en terreno técnico.', price: 132000, stock: 15, category: 'Calzado', imageUrl: image('chalten') },
  { name: 'Sandalias Río Azul', description: 'Sandalias de secado rápido para cruces de río.', price: 54000, stock: 0, category: 'Calzado', imageUrl: image('rio-azul') },
  { name: 'Mochila Cerro Catedral 40L', description: 'Mochila técnica de 40 litros con espaldar ventilado.', price: 145000, stock: 10, category: 'Mochilas', imageUrl: image('catedral') },
  { name: 'Mochila Day Pack 20L', description: 'Mochila liviana para salidas de un día.', price: 68000, stock: 25, category: 'Mochilas', imageUrl: image('daypack') },
  { name: 'Carpa Glaciar 2 Personas', description: 'Carpa de doble techo, resistente a vientos patagónicos.', price: 310000, stock: 4, category: 'Camping', imageUrl: image('glaciar') },
  { name: 'Bolsa de Dormir Nahuel', description: 'Bolsa de dormir con temperatura de confort de -5 °C.', price: 120000, stock: 9, category: 'Camping', imageUrl: image('nahuel') },
  { name: 'Calentador Compacto', description: 'Calentador a gas ultraliviano con encendido piezoeléctrico.', price: 45000, stock: 18, category: 'Camping', imageUrl: image('calentador') },
  { name: 'Bastones de Trekking', description: 'Par de bastones telescópicos de aluminio.', price: 52000, stock: 14, category: 'Accesorios', imageUrl: image('bastones') },
  { name: 'Linterna Frontal 300lm', description: 'Linterna frontal recargable por USB.', price: 29000, stock: 30, category: 'Accesorios', imageUrl: image('frontal') },
  { name: 'Gorro Térmico Patagonia', description: 'Gorro de lana merino, abrigado y suave.', price: 18000, stock: 40, category: 'Accesorios', imageUrl: image('gorro') },
]

/** Carga productos de ejemplo. Solo para desarrollo. */
export async function seedProducts(): Promise<number> {
  await Promise.all(SAMPLE_PRODUCTS.map(createProduct))
  return SAMPLE_PRODUCTS.length
}