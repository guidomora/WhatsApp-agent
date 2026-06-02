# Implementation Plan: Billing Responsibility Separation

**Branch**: `001-billing-layers` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-billing-layers/spec.md`

## Summary

Refactor `BillingUsageModule` so billing data access is isolated behind repository responsibilities and workflow orchestration can move into use-cases when a service currently concentrates too much logic. The implementation must preserve all existing billing behavior, especially active subscription checks, monthly WhatsApp reservation limits, idempotent quota consumption, atomic quota updates, and quota release.

The technical approach is to keep the public `UsageLimitService` contract stable for current callers, extract database-specific queries and transaction operations into billing repositories, and introduce use-cases only for flows that combine business decisions with multi-step persistence orchestration.

## Technical Context

**Language/Version**: TypeScript on NestJS backend; project uses strict TypeScript conventions.

**Primary Dependencies**: NestJS dependency injection, TypeORM repositories/query builders, Jest tests, existing project utilities from `src/lib` and `src/constants`.

**Storage**: PostgreSQL through TypeORM entities in `src/modules/billing-usage/entities`.

**Testing**: Jest unit tests colocated with services/use-cases/repositories; mocks in `src/modules/billing-usage/test/mocks`.

**Target Platform**: Backend service runtime for the WhatsApp reservation bot.

**Project Type**: Single NestJS backend service.

**Performance Goals**: Preserve current atomic quota behavior and avoid extra database round trips in the quota consumption and release paths.

**Constraints**: No new dependencies; no customer-facing behavior changes; no public contract break for current module consumers; no `any`; new interfaces/types/enums must live under `src/lib/types`; run `npm run fix` after code implementation.

**Scale/Scope**: Limited to `src/modules/billing-usage`, related billing types in `src/lib/types/billing-usage`, tests/mocks for this module, and architecture docs only if ownership boundaries change.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

The constitution file still contains placeholders and does not define enforceable project gates. This plan applies the active repository rules from `AGENTS.md` instead:

- Keep changes scoped to the requested billing responsibility separation.
- Preserve existing behavior and contracts.
- Follow Nest module structure: `module`, `service`, `application`, `entities`, and repository-related boundaries.
- Place reusable interfaces/types/enums in `src/lib/types`.
- Add focused tests for services, repositories, use-cases, and helpers; do not test `.module.ts`.
- Run `npm run fix` and impacted tests during implementation.

Initial gate result: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-billing-layers/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- billing-layer-contract.md
|-- checklists/
|   `-- requirements.md
`-- spec.md
```

### Source Code (repository root)

```text
src/
|-- lib/
|   `-- types/
|       `-- billing-usage/
|           |-- billing-usage.type.ts
|           `-- index.ts
`-- modules/
    `-- billing-usage/
        |-- application/
        |   |-- check-whatsapp-reservation-quota.use-case.ts
        |   |-- consume-whatsapp-reservation-quota.use-case.ts
        |   `-- release-whatsapp-reservation-quota.use-case.ts
        |-- domain/
        |   `-- repository/
        |       `-- billing-usage.repository.ts
        |-- entities/
        |   |-- account.entity.ts
        |   |-- monthly-usage.entity.ts
        |   |-- plan.entity.ts
        |   |-- subscription.entity.ts
        |   `-- usage-event.entity.ts
        |-- service/
        |   |-- billing-period.service.ts
        |   `-- usage-limit.service.ts
        |-- test/
        |   `-- mocks/
        |       `-- dependency-mocks.ts
        `-- billing-usage.module.ts
```

**Structure Decision**: Keep `UsageLimitService` as the exported module-facing facade because `BillingUsageModule` already exports it and other modules depend on that contract. Add `domain/repository` for database access and `application` use-cases only for the quota flows that currently mix business decisions, transactions, idempotency, and query details.

## Complexity Tracking

| Violation                             | Why Needed                                                                                                                                               | Simpler Alternative Rejected Because                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Repository boundary in billing module | `UsageLimitService` currently owns TypeORM repositories, query builders, transaction execution, and raw result parsing in addition to billing decisions. | Leaving direct database access in the service keeps the large-file/multiple-responsibility problem that this feature is meant to solve. |
| Use-case boundary for quota flows     | The consume/release flows combine orchestration, business decisions, idempotency, and persistence sequencing.                                            | Moving only query code to a repository would still leave the service responsible for too much workflow logic.                           |

## Phase 0: Research

Research completed in [research.md](./research.md). Main decisions:

- Use `domain/repository` for billing persistence because the repository owns database-specific details and can be tested independently.
- Use `application/*.use-case.ts` for quota workflows where orchestration is non-trivial.
- Keep `UsageLimitService` as a facade to preserve external callers and module exports.
- Keep `BillingPeriodService` unchanged unless implementation reveals a direct dependency cleanup need.

## Phase 1: Design

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/billing-layer-contract.md](./contracts/billing-layer-contract.md)
- [quickstart.md](./quickstart.md)

### Implementation Outline

1. Add billing repository contracts/types in `src/lib/types/billing-usage` for repository inputs/outputs when reusable outside a single class.
2. Create `BillingUsageRepository` under `src/modules/billing-usage/domain/repository`.
3. Move active subscription lookup, monthly usage lookup, usage event insert/delete, monthly usage initialize/increment/decrement, transaction execution, and raw result interpretation into repository responsibility.
4. Add use-cases under `src/modules/billing-usage/application` for:
   - checking WhatsApp reservation quota,
   - consuming WhatsApp reservation quota atomically,
   - releasing WhatsApp reservation quota.
5. Refactor `UsageLimitService` into a thin facade that delegates to these use-cases and preserves method names and return types.
6. Register repository and use-cases in `BillingUsageModule` providers while keeping `UsageLimitService` exported.
7. Update tests and mocks to cover repository behavior and facade/use-case behavior without duplicating assertions unnecessarily.
8. Update `docs/architecture/module-map.md` if the implementation materially changes billing ownership documentation.

## Post-Design Constitution Check

Gate result: PASS.

The design keeps changes scoped to billing, preserves current public behavior, avoids new dependencies, adds tests at the service/use-case/repository level, and follows existing project conventions for `application` use-cases.
