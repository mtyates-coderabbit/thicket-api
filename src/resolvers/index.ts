import type { CartRecord, LineItemRecord, OrderRecord, Store } from '../data/store';
import { checkout, type CheckoutInput } from '../domain/checkout';
import { badInput, notFound } from '../domain/errors';
import { computeTotals, lineTotal } from '../domain/pricing';
import { refundOrder } from '../domain/refunds';

export interface Context {
  store: Store;
}

const byNewest = (a: OrderRecord, b: OrderRecord) => b.createdAt.localeCompare(a.createdAt);

function cartLines(store: Store, cart: CartRecord) {
  return cart.items.map((item) => {
    const product = store.products.get(item.productId);
    if (!product) throw notFound('Product', item.productId);
    return { product, quantity: item.quantity, unitPrice: product.price };
  });
}

export const resolvers = {
  Query: {
    products: (_: unknown, { first }: { first: number }, { store }: Context) =>
      [...store.products.values()].slice(0, first),
    product: (_: unknown, { id }: { id: string }, { store }: Context) => store.products.get(id) ?? null,
    cart: (_: unknown, { id }: { id: string }, { store }: Context) => store.carts.get(id) ?? null,
    order: (_: unknown, { id }: { id: string }, { store }: Context) => store.orders.get(id) ?? null,
    orders: (_: unknown, args: { customerId?: string | null; first: number }, { store }: Context) =>
      [...store.orders.values()]
        .filter((o) => !args.customerId || o.customerId === args.customerId)
        .sort(byNewest)
        .slice(0, args.first),
  },

  Mutation: {
    addToCart: (
      _: unknown,
      { cartId, productId, quantity }: { cartId: string; productId: string; quantity: number },
      { store }: Context,
    ) => {
      const cart = store.carts.get(cartId);
      if (!cart) throw notFound('Cart', cartId);
      if (!store.products.has(productId)) throw notFound('Product', productId);
      if (quantity < 1) throw badInput('quantity must be at least 1');
      const existing = cart.items.find((i) => i.productId === productId);
      if (existing) existing.quantity += quantity;
      else cart.items.push({ productId, quantity });
      return cart;
    },
    removeFromCart: (_: unknown, { cartId, productId }: { cartId: string; productId: string }, { store }: Context) => {
      const cart = store.carts.get(cartId);
      if (!cart) throw notFound('Cart', cartId);
      cart.items = cart.items.filter((i) => i.productId !== productId);
      return cart;
    },
    checkout: (_: unknown, { input }: { input: CheckoutInput }, { store }: Context) => checkout(store, input),
    refundOrder: (_: unknown, { orderId, amount }: { orderId: string; amount?: number | null }, { store }: Context) =>
      refundOrder(store, orderId, amount),
  },

  Product: {
    inStock: (p: { inventory: number }) => p.inventory > 0,
  },

  Cart: {
    items: (cart: CartRecord, _: unknown, { store }: Context) =>
      cartLines(store, cart).map((line) => ({ ...line, lineTotal: lineTotal(line) })),
    subtotal: (cart: CartRecord, _: unknown, { store }: Context) => computeTotals(cartLines(store, cart)).subtotal,
  },

  Order: {
    customer: (order: OrderRecord, _: unknown, { store }: Context) => {
      const customer = store.customers.get(order.customerId);
      if (!customer) throw notFound('Customer', order.customerId);
      return customer;
    },
    subtotal: (order: OrderRecord) => computeTotals(order.items).subtotal,
    tax: (order: OrderRecord) => computeTotals(order.items).tax,
    total: (order: OrderRecord) => computeTotals(order.items).total,
    currency: () => 'USD',
    payment: (order: OrderRecord, _: unknown, { store }: Context) => {
      const payment = store.payments.get(order.paymentId);
      if (!payment) throw notFound('Payment', order.paymentId);
      return payment;
    },
    shippingAddress: (order: OrderRecord) => order.shippingAddress ?? null,
  },

  OrderItem: {
    product: (item: LineItemRecord, _: unknown, { store }: Context) => {
      const product = store.products.get(item.productId);
      if (!product) throw notFound('Product', item.productId);
      return product;
    },
    lineTotal: (item: LineItemRecord) => lineTotal(item),
  },
};
