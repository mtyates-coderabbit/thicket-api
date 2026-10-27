import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

const ORDER = /* GraphQL */ `
  query Order($id: ID!) {
    order(id: $id) {
      number
      status
      subtotal
      tax
      total
      currency
      items { quantity unitPrice lineTotal product { name } }
      payment { status method last4 amount }
    }
  }
`;

describe('orders', () => {
  it('resolves order totals', async () => {
    const { execute } = setup();
    const { data, errors } = await execute(ORDER, { id: 'ord_1001' });
    expect(errors).toBeUndefined();
    expect(data.order).toMatchObject({
      number: 'TH-1001',
      status: 'PAID',
      subtotal: 4399,
      tax: 363,
      total: 4762,
      currency: 'USD',
    });
  });

  it('captured payment amount matches the order total', async () => {
    const { execute } = setup();
    const { data } = await execute(ORDER, { id: 'ord_1001' });
    expect(data.order.payment).toEqual({ status: 'CAPTURED', method: 'card', last4: '4242', amount: 4762 });
    expect(data.order.payment.amount).toBe(data.order.total);
  });

  it('every order exposes a payment', async () => {
    const { execute } = setup();
    const { data, errors } = await execute(`{ orders { id payment { id status } } }`);
    expect(errors).toBeUndefined();
    for (const order of data.orders) {
      expect(order.payment).not.toBeNull();
    }
  });

  it('lists orders newest first and filters by customer', async () => {
    const { execute } = setup();
    const { data } = await execute(`{ orders(customerId: "cus_avery") { number } }`);
    expect(data.orders.map((o: { number: string }) => o.number)).toEqual(['TH-1002', 'TH-1001']);
  });

  it('returns null for an unknown order', async () => {
    const { execute } = setup();
    const { data } = await execute(ORDER, { id: 'ord_missing' });
    expect(data.order).toBeNull();
  });
});
