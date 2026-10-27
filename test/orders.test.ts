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
  it('resolves totals in dollars', async () => {
    const { execute } = setup();
    const { data, errors } = await execute(ORDER, { id: 'ord_1001' });
    expect(errors).toBeUndefined();
    expect(data.order).toMatchObject({
      number: 'TH-1001',
      status: 'PAID',
      subtotal: 43.99,
      tax: 3.63,
      total: 47.62,
      currency: 'USD',
    });
  });

  it('captured payment amount matches the order total', async () => {
    const { execute } = setup();
    const { data } = await execute(ORDER, { id: 'ord_1001' });
    expect(data.order.payment).toEqual({ status: 'CAPTURED', method: 'card', last4: '4242', amount: 47.62 });
    expect(data.order.payment.amount).toBe(data.order.total);
  });

  it('returns a null payment for unpaid invoice orders', async () => {
    const { execute } = setup();
    await execute(
      `mutation($input: CheckoutInput!) { checkout(input: $input) { order { id } } }`,
      {
        input: {
          cartId: 'cart_avery',
          email: 'avery@example.com',
          shippingAddress: { line1: '742 Alder Street', city: 'Portland', region: 'OR', postalCode: '97205', country: 'US' },
        },
      },
    );
    const { data, errors } = await execute(`{ orders(customerId: "cus_avery") { number status payment { id } } }`);
    expect(errors).toBeUndefined();
    expect(data.orders[0]).toEqual({ number: 'TH-1005', status: 'PENDING', payment: null });
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
