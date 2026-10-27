import { describe, expect, it } from 'vitest';
import { setup } from './helpers';

const CHECKOUT = /* GraphQL */ `
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      order { number status total items { quantity product { id } } }
      payment { status last4 amount }
    }
  }
`;

const address = { line1: '742 Alder Street', city: 'Portland', region: 'OR', postalCode: '97205', country: 'US' };

describe('checkout', () => {
  it('creates a paid order and captures the total', async () => {
    const { execute, store } = setup();
    const { data, errors } = await execute(CHECKOUT, {
      input: { cartId: 'cart_avery', email: 'avery@example.com', shippingAddress: address, cardToken: 'tok_visa_4242' },
    });
    expect(errors).toBeUndefined();
    expect(data.checkout.order).toMatchObject({ number: 'TH-1005', status: 'PAID', total: 7307 });
    expect(data.checkout.payment).toEqual({ status: 'CAPTURED', last4: '4242', amount: 7307 });
    expect(store.carts.get('cart_avery')!.items).toHaveLength(0);
  });

  it('decrements inventory', async () => {
    const { execute, store } = setup();
    const before = store.products.get('prod_terrarium')!.inventory;
    await execute(CHECKOUT, {
      input: { cartId: 'cart_avery', email: 'avery@example.com', shippingAddress: address, cardToken: 'tok_visa_4242' },
    });
    expect(store.products.get('prod_terrarium')!.inventory).toBe(before - 1);
  });

  it('rejects an empty cart', async () => {
    const { execute } = setup();
    const { errors } = await execute(CHECKOUT, {
      input: { cartId: 'cart_jordan', email: 'jordan@example.com', shippingAddress: address, cardToken: 'tok_visa_4242' },
    });
    expect(errors?.[0]).toMatchObject({ message: 'Cart is empty', extensions: { code: 'BAD_USER_INPUT' } });
  });

  it('rejects an unknown cart', async () => {
    const { execute } = setup();
    const { errors } = await execute(CHECKOUT, {
      input: { cartId: 'cart_nope', email: 'x@example.com', shippingAddress: address, cardToken: 'tok_visa_4242' },
    });
    expect(errors?.[0].extensions?.code).toBe('NOT_FOUND');
  });

  it('rejects an out-of-stock product', async () => {
    const { execute } = setup();
    await execute(`mutation { addToCart(cartId: "cart_jordan", productId: "prod_tray") { id } }`);
    const { errors } = await execute(CHECKOUT, {
      input: { cartId: 'cart_jordan', email: 'jordan@example.com', shippingAddress: address, cardToken: 'tok_visa_4242' },
    });
    expect(errors?.[0].message).toBe('Seed Starter Tray is out of stock');
  });
});
