import { describe, expect, it } from 'vitest';
import { computeTotals, lineTotal, roundCurrency } from '../src/domain/pricing';

describe('pricing', () => {
  it('rounds to whole cents', () => {
    expect(roundCurrency(3.17625)).toBe(3.18);
    expect(roundCurrency(1.005)).toBe(1.01);
  });

  it('computes subtotal, tax, and total in dollars', () => {
    expect(
      computeTotals([
        { quantity: 1, unitPrice: 24.0 },
        { quantity: 1, unitPrice: 19.99 },
      ]),
    ).toEqual({ subtotal: 43.99, tax: 3.63, total: 47.62 });
  });

  it('multiplies line totals by quantity', () => {
    expect(lineTotal({ quantity: 3, unitPrice: 12.75 })).toBe(38.25);
  });

  it('returns zeros for an empty order', () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});
