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

export function lineTotal(line: PricedLine): number {
  return roundCurrency(line.unitPrice * line.quantity);
}

/** Computes subtotal, tax, and total in USD for a set of priced lines. */
export function computeTotals(lines: PricedLine[]): OrderTotals {
  const subtotal = roundCurrency(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  const tax = roundCurrency(subtotal * TAX_RATE);
  return { subtotal, tax, total: roundCurrency(subtotal + tax) };
}
