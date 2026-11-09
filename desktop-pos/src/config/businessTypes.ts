import { Car, Pill, Shirt, ShoppingBasket, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Registro de tipos de negocio. Es el único lugar que se toca para personalizar un rubro:
 *
 * - Función nueva solo para un tipo: añádela a `BusinessFeature`, ponla en `features`
 *   de ese tipo y protege su pantalla con `hasFeature('nombre')` (ver useBusiness).
 * - Tipo nuevo: añade su id a `BusinessTypeId` y su entrada en `BUSINESS_TYPES`;
 *   aparece solo en la pantalla inicial y en Configuración.
 */
export type BusinessFeature = 'mechanics';

export type BusinessTypeId = 'repuestos' | 'farmacia' | 'ropa' | 'colmado' | 'general';

export interface BusinessTypeConfig {
  id: BusinessTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
  features: BusinessFeature[];
  labels: {
    /** Cómo se llama un artículo en este negocio (Repuesto, Prenda, Producto...). */
    product: string;
    productExample: string;
    wholesalePrice: string;
  };
  defaultCategories: string[];
  /** Palabras en el nombre del producto que sugieren su categoría. */
  categoryHints: { category: string; keywords: string[] }[];
}

export const BUSINESS_TYPES: Record<BusinessTypeId, BusinessTypeConfig> = {
  repuestos: {
    id: 'repuestos',
    label: 'Repuestos y Taller',
    description: 'Piezas de vehículos, con mecánicos, comisiones y su panel de rendimiento.',
    icon: Car,
    features: ['mechanics'],
    labels: {
      product: 'Repuesto',
      productExample: 'Pastillas de Freno Cerámicas',
      wholesalePrice: 'Mayorista / Talleres',
    },
    defaultCategories: ['Frenos', 'Suspensión y Dirección', 'Motor', 'Eléctrico', 'Líquidos y Lubricantes', 'Accesorios', 'Gomas', 'Tubos'],
    categoryHints: [
      { category: 'Frenos', keywords: ['pastilla', 'disco', 'balata', 'freno'] },
      { category: 'Suspensión y Dirección', keywords: ['amortiguador', 'rotula', 'buje'] },
      { category: 'Motor', keywords: ['bujia', 'piston', 'correa', 'valvula'] },
      { category: 'Líquidos y Lubricantes', keywords: ['aceite', 'refrigerante', 'anticongelante'] },
      { category: 'Eléctrico', keywords: ['foco', 'bateria', 'alternador', 'sensor'] },
    ],
  },
  farmacia: {
    id: 'farmacia',
    label: 'Farmacia',
    description: 'Medicamentos y productos de salud y cuidado personal.',
    icon: Pill,
    features: [],
    labels: {
      product: 'Producto',
      productExample: 'Acetaminofén 500 mg',
      wholesalePrice: 'Mayorista',
    },
    defaultCategories: ['Medicamentos', 'Vitaminas', 'Cuidado Personal', 'Bebés', 'Primeros Auxilios', 'Otros'],
    categoryHints: [
      { category: 'Vitaminas', keywords: ['vitamina', 'suplemento', 'omega'] },
      { category: 'Bebés', keywords: ['pañal', 'bebe', 'formula'] },
      { category: 'Primeros Auxilios', keywords: ['venda', 'gasa', 'alcohol', 'curita'] },
    ],
  },
  ropa: {
    id: 'ropa',
    label: 'Tienda de Ropa',
    description: 'Prendas, calzado y accesorios de moda.',
    icon: Shirt,
    features: [],
    labels: {
      product: 'Prenda',
      productExample: 'Camisa de Algodón Azul',
      wholesalePrice: 'Mayorista',
    },
    defaultCategories: ['Damas', 'Caballeros', 'Niños', 'Calzado', 'Accesorios'],
    categoryHints: [
      { category: 'Calzado', keywords: ['zapato', 'tenis', 'sandalia', 'bota'] },
      { category: 'Accesorios', keywords: ['correa', 'gorra', 'cartera', 'bolso'] },
    ],
  },
  colmado: {
    id: 'colmado',
    label: 'Colmado',
    description: 'Alimentos, bebidas y artículos del hogar.',
    icon: ShoppingBasket,
    features: [],
    labels: {
      product: 'Producto',
      productExample: 'Arroz Selecto 5 lb',
      wholesalePrice: 'Mayorista',
    },
    defaultCategories: ['Abarrotes', 'Bebidas', 'Lácteos', 'Embutidos', 'Limpieza', 'Otros'],
    categoryHints: [
      { category: 'Bebidas', keywords: ['refresco', 'jugo', 'agua', 'cerveza', 'malta'] },
      { category: 'Lácteos', keywords: ['leche', 'queso', 'yogurt', 'mantequilla'] },
      { category: 'Embutidos', keywords: ['salami', 'jamon', 'salchicha', 'longaniza'] },
      { category: 'Limpieza', keywords: ['jabon', 'detergente', 'cloro', 'suavizante'] },
    ],
  },
  general: {
    id: 'general',
    label: 'Otro Tipo de Negocio',
    description: 'Ferreterías, librerías y cualquier otro comercio.',
    icon: Store,
    features: [],
    labels: {
      product: 'Producto',
      productExample: 'Nombre del producto',
      wholesalePrice: 'Mayorista',
    },
    defaultCategories: ['General', 'Otros'],
    categoryHints: [],
  },
};

export const BUSINESS_TYPE_LIST = Object.values(BUSINESS_TYPES);

export const isBusinessTypeId = (value: unknown): value is BusinessTypeId =>
  BUSINESS_TYPE_LIST.some(type => type.id === value);

/** Repuestos conserva la clave original para no perder las categorías de quienes ya la usan. */
export const getCategoriesStorageKey = (id: BusinessTypeId) =>
  id === 'repuestos' ? 'inventoryCategories' : `inventoryCategories_${id}`;

export const predictCategory = (config: BusinessTypeConfig, productName: string, fallback: string) => {
  const name = productName.toLowerCase();
  const hint = config.categoryHints.find(({ keywords }) => keywords.some(keyword => name.includes(keyword)));
  return hint?.category ?? fallback;
};
