# thicket-api

GraphQL API for **Thicket**, a small storefront for plants and garden supplies.
It serves products, carts, checkout, orders, and refunds from an in-memory store
seeded with sample data.

Clients:

- [thicket-web](https://github.com/mtyates-coderabbit/thicket-web) — React web storefront
- [thicket-mobile](https://github.com/mtyates-coderabbit/thicket-mobile) — Expo / React Native app

## Requirements

- Node.js 20 or later

## Running locally

```bash
npm install
npm run dev
```

The API listens on <http://localhost:4000/graphql>. Open that URL in a browser for
GraphiQL. Set `PORT` to use a different port. Data resets on every restart.

Example query:

```graphql
{
  orders(customerId: "cus_avery") {
    number
    status
    totalAmount
    payment { status last4 }
  }
}
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the API with reload on change |
| `npm start` | Start the API |
| `npm run typecheck` | Type-check the project |
| `npm test` | Run tests |
| `npm run schema:diff -- <base> <proposed>` | Report breaking and dangerous schema changes |
| `npm run operations:validate -- <schema> <client-dir>...` | Validate client operations against a schema |

To check local clients against your working schema:

```bash
npm run operations:validate -- schema/schema.graphql ../thicket-web ../thicket-mobile
```

## Seed data

| ID | Description |
| --- | --- |
| `cus_avery`, `cus_jordan` | Customers |
| `cart_avery`, `cart_jordan` | Carts (Jordan's starts empty) |
| `ord_1001` … `ord_1004` | Orders in PAID, FULFILLED, PENDING, and REFUNDED states |

Card tokens look like `tok_visa_4242`; the last four digits are recorded on the payment.

See [docs/schema-guidelines.md](docs/schema-guidelines.md) for how the schema evolves.
