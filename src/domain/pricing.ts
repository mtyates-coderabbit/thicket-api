export const TAX_RATE = 0.0825;

export interface PricedLine {
  quantity: number;
  unitPrice: number;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

/** Rounds a USD amount to whole cents. */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Converts a decimal USD amount to integer cents. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function lineTotal(line: PricedLine): number {
  return roundCurrency(line.unitPrice * line.quantity);
}

/**
 * Computes subtotal, tax, and total for a set of priced lines.
 *
 * All arithmetic is done in integer cents so totals never drift from
 * floating-point rounding (e.g. 0.1 + 0.2).
 */
export function computeTotals(lines: PricedLine[]): OrderTotals {
  const subtotal = lines.reduce((sum, line) => sum + toCents(line.unitPrice) * line.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, tax, total: subtotal + tax };
}
