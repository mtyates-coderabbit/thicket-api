import type { OrderRecord, Store } from '../data/store';
import { badInput, notFound } from './errors';
import { computeTotals, roundCurrency } from './pricing';

const REFUNDABLE = new Set(['PAID', 'FULFILLED', 'PARTIALLY_REFUNDED']);

/**
 * Refunds part or all of an order. Omitting the amount refunds the remaining
 * balance. The order becomes PARTIALLY_REFUNDED until the full total has been
 * returned, then REFUNDED.
 */
export function refundOrder(store: Store, orderId: string, amount?: number | null): OrderRecord {
  const order = store.orders.get(orderId);
  if (!order) throw notFound('Order', orderId);
  if (!REFUNDABLE.has(order.status)) {
    throw badInput(`Order ${order.number} cannot be refunded while ${order.status}`);
  }

  const { total } = computeTotals(order.items);
  const alreadyRefunded = order.refundedAmount ?? 0;
  const remaining = roundCurrency(total - alreadyRefunded);
  const refund = amount ?? remaining;
  if (refund <= 0) throw badInput('Refund amount must be greater than zero');
  if (refund > remaining) throw badInput(`Refund exceeds remaining balance of ${remaining}`);

  const payment = store.payments.get(order.paymentId);
  if (!payment) throw notFound('Payment', order.paymentId);

  order.refundedAmount = roundCurrency(alreadyRefunded + refund);
  if (order.refundedAmount >= total) {
    order.status = 'REFUNDED';
    payment.status = 'REFUNDED';
  } else {
    order.status = 'PARTIALLY_REFUNDED';
  }
  return order;
}
