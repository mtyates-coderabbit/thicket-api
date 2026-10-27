import type { AddressRecord, OrderRecord, PaymentRecord, Store } from '../data/store';
import { badInput, notFound } from './errors';
import { computeTotals } from './pricing';

export interface CheckoutInput {
  cartId: string;
  email: string;
  shippingAddress: AddressRecord;
  /** Omitted for invoice orders, which are created PENDING without a payment. */
  cardToken?: string | null;
}

export interface CheckoutResult {
  order: OrderRecord;
  payment: PaymentRecord | null;
}

/** Extracts the last four digits from a token such as `tok_visa_4242`. */
export function last4FromToken(token: string): string {
  const match = /(\d{4})$/.exec(token);
  if (!match) throw badInput('cardToken is not a recognized card token');
  return match[1];
}

/**
 * Converts a cart into an order. With a card token the payment is captured
 * immediately; without one the order is created as an unpaid invoice. Prices are snapshotted onto the order's
 * line items so later catalog changes do not alter historical orders.
 */
export function checkout(store: Store, input: CheckoutInput, now = new Date()): CheckoutResult {
  const cart = store.carts.get(input.cartId);
  if (!cart) throw notFound('Cart', input.cartId);
  if (cart.items.length === 0) throw badInput('Cart is empty');

  const items = cart.items.map((item) => {
    const product = store.products.get(item.productId);
    if (!product) throw notFound('Product', item.productId);
    if (product.inventory < item.quantity) throw badInput(`${product.name} is out of stock`);
    return { id: store.nextId('li'), productId: product.id, quantity: item.quantity, unitPrice: product.price };
  });

  const last4 = input.cardToken ? last4FromToken(input.cardToken) : null;
  const { total } = computeTotals(items);
  const orderId = store.nextId('ord');
  const createdAt = now.toISOString();

  const order: OrderRecord = {
    id: orderId,
    number: store.nextOrderNumber(),
    customerId: cart.customerId,
    status: last4 ? 'PAID' : 'PENDING',
    createdAt,
    items,
    shippingAddress: input.shippingAddress,
  };

  let payment: PaymentRecord | null = null;
  if (last4) {
    payment = {
      id: store.nextId('pay'),
      orderId,
      status: 'CAPTURED',
      method: 'card',
      last4,
      amount: total,
      capturedAt: createdAt,
    };
    order.paymentId = payment.id;
    store.payments.set(payment.id, payment);
  }

  for (const item of items) {
    store.products.get(item.productId)!.inventory -= item.quantity;
  }
  store.orders.set(order.id, order);
  cart.items = [];

  return { order, payment };
}
