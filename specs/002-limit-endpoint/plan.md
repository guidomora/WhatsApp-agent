# Implementation Plan: Agent Reservation Limit Visibility

**Branch**: `feat/limit-endpoint` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-limit-endpoint/spec.md`

## Summary

Expose a secure internal `GET` endpoint in `BillingUsageModule` so the frontend can retrieve the remaining reservation quota available through the agent for a customer account. The endpoint will return the active plan limit, current-period usage, remaining quota, period bounds, and a display-ready quota state while reusing the same billing data and rules currently used by WhatsApp reservation limit enforcement.

The implementation will add a billing-usage controller, a read-only quota summary use-case, response/query DTOs, shared billing quota types, and focused tests. The existing internal API token guard will be moved from the reservations module into `src/common/guards` so both reservations dashboard endpoints and the new billing endpoint use the same `x-internal-api-token` protection.

## Technical Context

**Language/Version**: TypeScript with NestJS backend runtime

**Primary Dependencies**: NestJS, TypeORM, PostgreSQL, class-validator/class-transformer, Swagger decorators, Jest

**Storage**: Existing PostgreSQL billing tables: `plans`, `subscriptions`, `monthly_usage`, `usage_events`, `accounts`

**Testing**: Jest unit/controller tests through existing `npm test` workflow; lint/format through `npm run fix`

**Target Platform**: Backend web service deployed behind the existing `/bot` global prefix

**Project Type**: Single NestJS backend service

**Performance Goals**: Frontend obtains the quota summary in one backend request; the read path performs only the active subscription and current-period usage lookups needed for the summary

**Constraints**: Endpoint must be protected by `x-internal-api-token`; must not mutate usage; must not change how quota is consumed/released/enforced; remaining quota must never be negative

**Scale/Scope**: One internal endpoint for customer account quota visibility in the current billing period

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

The constitution file still contains placeholder principles and no enforceable project-specific gates. Project-level rules from `AGENTS.md` apply instead:

- Keep changes scoped to the requested billing endpoint.
- Respect NestJS module structure.
- Define interfaces/types/enums under `src/lib/types`.
- Reuse existing constants/helpers before creating new ones.
- Protect internal endpoints with the existing internal token pattern.
- Run `npm run fix` after code implementation and run relevant tests.

Initial gate status: PASS. No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/002-limit-endpoint/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- billing-usage-quota-endpoint.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
src/
|-- modules/
|   |-- billing-usage/
|   |   |-- application/
|   |   |   |-- get-whatsapp-reservation-quota-summary.use-case.ts
|   |   |   `-- get-whatsapp-reservation-quota-summary.use-case.spec.ts
|   |   |-- controller/
|   |   |   |-- billing-usage.controller.ts
|   |   |   `-- billing-usage.controller.spec.ts
|   |   |-- dto/
|   |   |   |-- billing-quota-summary-response.dto.ts
|   |   |   `-- billing-account-param.dto.ts
|   |   |-- domain/repository/
|   |   |   |-- billing-usage.repository.ts
|   |   |   `-- billing-usage.repository.spec.ts
|   |   `-- billing-usage.module.ts
|-- common/
|   `-- guards/
|       |-- internal-api-token.guard.ts
|       `-- internal-api-token.guard.spec.ts
|-- lib/types/billing-usage/
|   |-- billing-usage.type.ts
|   `-- index.ts
`-- constants/headers/
    `-- internal-api-token-header.ts
```

**Structure Decision**: Implement the endpoint inside `BillingUsageModule` because that module owns account plan, subscription, and monthly usage rules. Move `InternalApiTokenGuard` from `src/modules/reservations/guards` to `src/common/guards` so both reservations and billing endpoints share the same security control without making `billing-usage` depend on `reservations`.

## Complexity Tracking

No constitution violations or extra architectural complexity are required. Moving the guard to `src/common/guards` is a small dependency cleanup needed to avoid cross-module coupling from `billing-usage` back into `reservations`.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See:

- [data-model.md](./data-model.md)
- [billing-usage-quota-endpoint.md](./contracts/billing-usage-quota-endpoint.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

Status: PASS.

The design remains scoped to one internal billing endpoint, keeps quota business rules in `BillingUsageModule`, avoids new dependencies, avoids runtime mutations, and preserves the existing internal token security pattern.
