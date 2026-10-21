import Dexie, { type EntityTable } from 'dexie';

/**
 * RULES
 * - Quantities are integers in the smallest unit: grams, millilitres, pieces.
 *   1.5 kg is stored as 1500. Never store a float.
 * - Money is integer paise (₹1 = 100 paise). ₹62.50 is stored as 6250.
 * - `salePrice` / `purchasePrice` are paise per ONE display unit (per kg, per L, per pc).
 *   Totals are computed with integer math and a single rounding step.
 */

export type Unit = 'g' | 'ml' | 'pc';

export interface Product {
  id?: number;
  name: string;
  unit: Unit;           // base unit the stock and sale quantities are stored in
  stock: number;        // integer, in base unit
  salePrice: number;    // integer paise per display unit (kg / L / pc)
  purchasePrice: number; // integer paise per display unit (kg / L / pc)
}

export interface Sale {
  id?: number;
  productId: number;
  qty: number;   // integer, in the product's base unit
  total: number; // integer paise
  date: number;  // epoch milliseconds (integer)
}

/** How each base unit maps to what the shopkeeper sees and prices by. */
export const UNIT_META: Record<Unit, { display: string; factor: number }> = {
  g: { display: 'kg', factor: 1000 },
  ml: { display: 'L', factor: 1000 },
  pc: { display: 'pc', factor: 1 },
};

/** "1.5" kg -> 1500 g. The only place a decimal is turned into an integer. */
export const toBaseQty = (displayValue: number, unit: Unit): number =>
  Math.round(displayValue * UNIT_META[unit].factor);

/** 1500 g -> "1.5 kg". For display only, never for calculation. */
export const formatQty = (qty: number, unit: Unit): string => {
  const { display, factor } = UNIT_META[unit];
  if (factor === 1) return `${qty} ${display}`;
  if (qty < factor) return `${qty} ${unit}`;
  return `${parseFloat((qty / factor).toFixed(3))} ${display}`;
};

/** qty (base unit) x price (paise per display unit) -> total paise, rounded once. */
export const calcTotal = (qty: number, pricePerDisplayUnit: number, unit: Unit): number =>
  Math.round((qty * pricePerDisplayUnit) / UNIT_META[unit].factor);

/** Paise -> "₹62.50" for display. */
export const formatRupees = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

export const db = new Dexie('DukaanDairyDB') as Dexie & {
  products: EntityTable<Product, 'id'>;
  sales: EntityTable<Sale, 'id'>;
};

db.version(1).stores({
  products: '++id, name',
  sales: '++id, productId, date',
});