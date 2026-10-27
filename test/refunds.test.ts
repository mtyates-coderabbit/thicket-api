import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

const REFUND = /* GraphQL */ `
  mutation Refund($orderId: ID!, $amount: Float) {
    refundOrder(orderId: $orderId, amount: $amount) {
      status
      refundedAmount
      payment { status }
    }
  }
`;

describe('refunds', () => {
  it('refunds a paid order in full', async () => {
    const { execute } = setup();
    const { data, errors } = await execute(REFUND, { orderId: 'ord_1001' });
    expect(errors).toBeUndefined();
    expect(data.refundOrder).toEqual({ status: 'REFUNDED', refundedAmount: 47.62, payment: { status: 'REFUNDED' } });
  });

  it('partially refunds an order', async () => {
    const { execute } = setup();
    const { data, errors } = await execute(REFUND, { orderId: 'ord_1001', amount: 10 });
    expect(errors).toBeUndefined();
    expect(data.refundOrder).toEqual({ status: 'PARTIALLY_REFUNDED', refundedAmount: 10, payment: { status: 'CAPTURED' } });
  });

  it('refunds the remaining balance after a partial refund', async () => {
    const { execute } = setup();
    await execute(REFUND, { orderId: 'ord_1001', amount: 10 });
    const { data } = await execute(REFUND, { orderId: 'ord_1001' });
    expect(data.refundOrder).toEqual({ status: 'REFUNDED', refundedAmount: 47.62, payment: { status: 'REFUNDED' } });
  });

  it('rejects refunds above the remaining balance', async () => {
    const { execute } = setup();
    const { errors } = await execute(REFUND, { orderId: 'ord_1001', amount: 100 });
    expect(errors?.[0].message).toBe('Refund exceeds remaining balance of 47.62');
  });

  it('rejects refunds for pending orders', async () => {
    const { execute } = setup();
    const { errors } = await execute(REFUND, { orderId: 'ord_1003' });
    expect(errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
  });
});
