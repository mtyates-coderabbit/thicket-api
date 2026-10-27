export type OrderStatus = 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  inventory: number;
}

export interface StoreRecord {
  id: string;
  name: string;
  region: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
}

export interface AddressRecord {
  line1: string;
  line2?: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface LineItemRecord {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderRecord {
  id: string;
  number: string;
  customerId: string;
  status: OrderStatus;
  createdAt: string;
  items: LineItemRecord[];
  shippingAddress?: AddressRecord;
  paymentId: string;
  storeId: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  status: PaymentStatus;
  method: string;
  last4?: string;
  amount: number;
  capturedAt?: string;
}

export interface CartItemRecord {
  productId: string;
  quantity: number;
}

export interface CartRecord {
  id: string;
  customerId: string;
  items: CartItemRecord[];
}

/**
 * In-memory data store. Each call to createStore() returns a freshly seeded
 * instance so tests never share state.
 */
export class Store {
  stores = new Map<string, StoreRecord>();
  products = new Map<string, ProductRecord>();
  customers = new Map<string, CustomerRecord>();
  orders = new Map<string, OrderRecord>();
  payments = new Map<string, PaymentRecord>();
  carts = new Map<string, CartRecord>();

  private sequence = 1000;

  nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence}`;
  }

  nextOrderNumber(): string {
    const highest = Math.max(
      1000,
      ...[...this.orders.values()].map((o) => Number(o.number.replace('TH-', ''))),
    );
    return `TH-${highest + 1}`;
  }
}

const seedAddress: AddressRecord = {
  line1: '742 Alder Street',
  city: 'Portland',
  region: 'OR',
  postalCode: '97205',
  country: 'US',
};

export function createStore(): Store {
  const store = new Store();

  const stores: StoreRecord[] = [
    { id: 'store_pdx', name: 'Thicket Portland', region: 'OR' },
    { id: 'store_sea', name: 'Thicket Seattle', region: 'WA' },
  ];
  stores.forEach((s) => store.stores.set(s.id, s));

  const products: ProductRecord[] = [
    { id: 'prod_fern', sku: 'PLN-001', name: 'Fern Planter', description: 'Glazed ceramic planter, 8 in.', price: 24.0, inventory: 40 },
    { id: 'prod_terrarium', sku: 'KIT-014', name: 'Moss Terrarium Kit', description: 'Glass jar, moss, and stones.', price: 38.5, inventory: 12 },
    { id: 'prod_shears', sku: 'TLS-203', name: 'Pruning Shears', description: 'Bypass shears with steel blades.', price: 19.99, inventory: 60 },
    { id: 'prod_can', sku: 'TLS-118', name: 'Watering Can', description: 'Two-litre galvanized steel.', price: 29.0, inventory: 25 },
    { id: 'prod_tray', sku: 'SDS-040', name: 'Seed Starter Tray', description: '72-cell tray with humidity dome.', price: 12.75, inventory: 0 },
  ];
  products.forEach((p) => store.products.set(p.id, p));

  const customers: CustomerRecord[] = [
    { id: 'cus_avery', name: 'Avery Chen', email: 'avery@example.com' },
    { id: 'cus_jordan', name: 'Jordan Patel', email: 'jordan@example.com' },
  ];
  customers.forEach((c) => store.customers.set(c.id, c));

  const orders: Array<OrderRecord & { payment: Omit<PaymentRecord, 'orderId'> }> = [
    {
      id: 'ord_1001', number: 'TH-1001', customerId: 'cus_avery', status: 'PAID', createdAt: '2026-09-02T15:04:00.000Z',
      items: [
        { id: 'li_1', productId: 'prod_fern', quantity: 1, unitPrice: 24.0 },
        { id: 'li_2', productId: 'prod_shears', quantity: 1, unitPrice: 19.99 },
      ],
      shippingAddress: seedAddress, paymentId: 'pay_1001', storeId: 'store_pdx',
      payment: { id: 'pay_1001', status: 'CAPTURED', method: 'card', last4: '4242', amount: 47.62, capturedAt: '2026-09-02T15:04:05.000Z' },
    },
    {
      id: 'ord_1002', number: 'TH-1002', customerId: 'cus_avery', status: 'FULFILLED', createdAt: '2026-09-14T18:30:00.000Z',
      items: [{ id: 'li_3', productId: 'prod_terrarium', quantity: 1, unitPrice: 38.5 }],
      shippingAddress: seedAddress, paymentId: 'pay_1002', storeId: 'store_pdx',
      payment: { id: 'pay_1002', status: 'CAPTURED', method: 'card', last4: '1881', amount: 41.68, capturedAt: '2026-09-14T18:30:04.000Z' },
    },
    {
      id: 'ord_1003', number: 'TH-1003', customerId: 'cus_jordan', status: 'PENDING', createdAt: '2026-10-20T09:12:00.000Z',
      items: [{ id: 'li_4', productId: 'prod_tray', quantity: 2, unitPrice: 12.75 }],
      shippingAddress: { ...seedAddress, line1: '18 Birch Court', city: 'Seattle', region: 'WA', postalCode: '98101' },
      paymentId: 'pay_1003', storeId: 'store_sea',
      payment: { id: 'pay_1003', status: 'AUTHORIZED', method: 'card', last4: '0005', amount: 27.6 },
    },
    {
      id: 'ord_1004', number: 'TH-1004', customerId: 'cus_jordan', status: 'REFUNDED', createdAt: '2026-08-28T12:00:00.000Z',
      items: [{ id: 'li_5', productId: 'prod_can', quantity: 1, unitPrice: 29.0 }],
      paymentId: 'pay_1004', storeId: 'store_sea',
      payment: { id: 'pay_1004', status: 'REFUNDED', method: 'paypal', amount: 31.39, capturedAt: '2026-08-28T12:00:03.000Z' },
    },
  ];
  for (const { payment, ...order } of orders) {
    store.orders.set(order.id, order);
    store.payments.set(payment.id, { ...payment, orderId: order.id });
  }

  store.carts.set('cart_avery', {
    id: 'cart_avery',
    customerId: 'cus_avery',
    items: [
      { productId: 'prod_terrarium', quantity: 1 },
      { productId: 'prod_can', quantity: 1 },
    ],
  });
  store.carts.set('cart_jordan', { id: 'cart_jordan', customerId: 'cus_jordan', items: [] });

  return store;
}
