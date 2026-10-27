# Changelog

All notable changes to the API contract are documented here.

## Unreleased

- Checkout accepts orders without a card token (invoice orders). `Order.payment` and
  `CheckoutResult.payment` are now nullable.

## 0.1.0

- Initial schema: products, carts, orders, payments, checkout, and full refunds.
