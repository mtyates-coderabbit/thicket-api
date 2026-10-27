# Schema guidelines

`schema/schema.graphql` is the contract between this API and its clients
([thicket-web](https://github.com/mtyates-coderabbit/thicket-web) and
[thicket-mobile](https://github.com/mtyates-coderabbit/thicket-mobile)). Clients
select fields explicitly, so a change that looks small on the server can make an
existing client query invalid before any resolver runs.

## Change categories

| Change | Category | Notes |
| --- | --- | --- |
| Add a type, field, or optional argument | Additive | Safe. |
| Add an enum value | Dangerous | Queries stay valid, but exhaustive client handling may break. |
| Add a required argument or input field without a default | Breaking | Existing callers become invalid. |
| Remove or rename a field, argument, type, or enum value | Breaking | Deprecate first. |
| Output `T!` → `T` | Breaking | Clients lose a guarantee they rely on. |
| Output `T` → `T!` | Needs care | The resolver must always return a value or errors propagate to the parent. |
| Input optional → required | Breaking | Clients must now send it. |
| Change units or meaning of an existing field | Breaking (behavioral) | The schema diff will not catch it. |

## Rules

1. **Deprecate, then remove.** Add the replacement field, mark the old one with
   `@deprecated(reason: "Use <replacement>.")`, migrate clients, and only remove it
   once no committed client operation selects it.
2. **New arguments are optional.** Give new arguments and input fields a default or
   make them nullable. If a value is truly required, add a new field.
3. **Keep nullability promises.** Do not weaken non-null outputs. When strengthening an
   output to non-null, add a test that proves the resolver never returns null.
4. **Enum additions are coordinated.** Before adding an enum value, make sure both
   clients handle unknown values gracefully, or ship the client change first.
5. **Units are part of the contract.** All money fields are USD decimal amounts
   (`47.62` means $47.62). Changing units requires a new field, an updated
   description, and a CHANGELOG entry.

## Checks

CI runs on every pull request:

- `npm run schema:diff` compares the proposed schema with the base branch and fails on
  breaking changes.
- `npm run operations:validate` validates every operation committed in thicket-web and
  thicket-mobile against the proposed schema.
- `npm test` runs resolver and contract tests.
