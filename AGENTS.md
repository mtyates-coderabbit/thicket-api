# thicket-api

GraphQL API for the Thicket storefront, built with GraphQL Yoga and an in-memory store.

## Layout

- `schema/schema.graphql` — the SDL. This is the source of truth for the API contract.
- `src/resolvers/` — resolver map. Keep resolvers thin; business logic goes in `src/domain/`.
- `src/domain/` — pricing, checkout, and refund logic.
- `src/data/store.ts` — in-memory store and seed data.
- `test/` — Vitest tests that execute GraphQL operations through `createApp()`.
- `scripts/` — CI tooling for schema diffs and client operation validation.

## Conventions

- Follow [docs/schema-guidelines.md](docs/schema-guidelines.md) for every schema change.
- Throw `GraphQLError` with an `extensions.code` (`NOT_FOUND`, `BAD_USER_INPUT`) from
  `src/domain/errors.ts` rather than plain `Error`.
- Money values are USD decimals rounded to cents via `roundCurrency`.
- Every schema or behavior change needs a test that runs a GraphQL operation.
- Record user-visible API changes in `CHANGELOG.md` under "Unreleased".

## Commands

```bash
npm run dev          # start the API on http://localhost:4000/graphql
npm run typecheck
npm test
```
