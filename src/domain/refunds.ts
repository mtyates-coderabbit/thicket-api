import type { OrderRecord, Store } from '../data/store';
import { badInput, notFound } from './errors';
import { computeTotals } from './pricing';

const REFUNDABLE = new Set(['PAID', 'FULFILLED']);

/**
 * Refunds an order in full. Partial refunds are not supported yet; callers
 * passing an amount lower than the order total receive BAD_USER_INPUT.
 */
export function refundOrder(store: Store, orderId: string, amount?: number | null): OrderRecord {
  const order = store.orders.get(orderId);
  if (!order) throw notFound('Order', orderId);
  if (!REFUNDABLE.has(order.status)) {
    throw badInput(`Order ${order.number} cannot be refunded while ${order.status}`);
  }

  const { total } = computeTotals(order.items);
  if (amount != null && amount < total) {
    throw badInput('Partial refunds are not supported');
  }

  const payment = order.paymentId ? store.payments.get(order.paymentId) : undefined;
  if (!payment) throw badInput(`Order ${order.number} has no payment to refund`);

  order.status = 'REFUNDED';
  payment.status = 'REFUNDED';
  return order;
}
