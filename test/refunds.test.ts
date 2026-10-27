import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

const REFUND = /* GraphQL */ `
  mutation Refund($orderId: ID!, $amount: Float) {
    refundOrder(orderId: $orderId, amount: $amount) {
      status
      payment { status }
    }
  }
`;

describe('refunds', () => {
  it('refunds a paid order in full', async () => {
    const { execute } = setup();
    const { data, errors } = await execute(REFUND, { orderId: 'ord_1001' });
    expect(errors).toBeUndefined();
    expect(data.refundOrder).toEqual({ status: 'REFUNDED', payment: { status: 'REFUNDED' } });
  });

  it('rejects partial refunds', async () => {
    const { execute } = setup();
    const { errors } = await execute(REFUND, { orderId: 'ord_1001', amount: 10 });
    expect(errors?.[0].message).toBe('Partial refunds are not supported');
  });

  it('rejects refunds for pending orders', async () => {
    const { execute } = setup();
    const { errors } = await execute(REFUND, { orderId: 'ord_1003' });
    expect(errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
  });
});
