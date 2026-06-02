# Quickstart: Billing Responsibility Separation

## Scope

Refactor only the billing usage responsibility boundaries:

- `src/modules/billing-usage`
- `src/lib/types/billing-usage`
- billing tests and mocks
- architecture docs only if ownership boundaries change

## Suggested Implementation Order

1. Read the current billing files:
   - `src/modules/billing-usage/service/usage-limit.service.ts`
   - `src/modules/billing-usage/service/usage-limit.service.spec.ts`
   - `src/modules/billing-usage/test/mocks/dependency-mocks.ts`
   - `src/modules/billing-usage/billing-usage.module.ts`
2. Add repository-facing types to `src/lib/types/billing-usage` when they are reused by more than one class.
3. Create `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`.
4. Move TypeORM data access and transaction operations into the repository.
5. Create use-cases in `src/modules/billing-usage/application` only for quota workflows that have meaningful orchestration.
6. Refactor `UsageLimitService` into a facade that delegates to use-cases.
7. Update `BillingUsageModule` providers.
8. Update tests and mocks:
   - repository tests for query/transaction behavior,
   - use-case tests for business result mapping,
   - service tests for public facade delegation.
9. Update `docs/architecture/module-map.md` if the final source structure changes the billing module ownership map.

## Validation Commands

Run after implementation:

```powershell
npm run fix
npm test -- src/modules/billing-usage
npm test
```

If `npm run fix` changes files, review the diff before finalizing.

## Validation Results

- `npm run fix`: PASS on 2026-06-01. Prettier completed and ESLint reported no errors after fixes.
- `npm test -- src/modules/billing-usage`: PASS on 2026-06-01. 6 test suites passed, 28 tests passed.
- `npm test`: PASS on 2026-06-01. 88 test suites passed, 505 tests passed.

## Behavior Checklist

- Active subscription missing still returns `missing_active_subscription`.
- Inactive plan still returns `inactive_plan`.
- Limit reached still returns `limit_reached`.
- Duplicate consumption remains `allowed: true` with `alreadyConsumed: true`.
- Successful consumption remains `allowed: true` with `alreadyConsumed: false`.
- Release with an existing event returns `released: true`.
- Release without an existing event returns `released: false`.
- Monthly usage never increments above the plan limit.
- Monthly usage never decrements below zero.
