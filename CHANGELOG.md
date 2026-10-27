# Changelog

All notable changes to the API contract are documented here.

## Unreleased

- `refundOrder` supports partial refunds. Adds `OrderStatus.PARTIALLY_REFUNDED` and
  `Order.refundedAmount`.

## 0.1.0

- Initial schema: products, carts, orders, payments, checkout, and full refunds.
