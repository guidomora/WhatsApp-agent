# Implementation Plan: Reservation Context Services

**Branch**: `feat/reservation-context-services` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-reservation-context-services/spec.md`

## Summary

Build the application layer for `ReservationContextModule` on top of the Phase 1 storage contract. This phase adds focused services/use-cases for validating, saving, retrieving, cancelling, and expiring reservation context snapshots; expands shared types under `src/lib/types/reservation-context`; adds unit tests with local module mocks; and updates architecture docs to describe the new application boundary. Live WhatsApp create/update/cancel flows remain unchanged until a later integration phase explicitly wires them to these capabilities.

## Technical Context

**Language/Version**: TypeScript with NestJS backend runtime

**Primary Dependencies**: NestJS, TypeORM, PostgreSQL, Jest; no new dependencies planned

**Storage**: Existing PostgreSQL `reservation_contexts` table and `ReservationContextRepository` from `003-reservation-context-storage`; no schema changes expected

**Testing**: Jest unit tests via existing `npm test` workflow and focused `npm run test:reservation-context`; formatting/linting via `npm run fix`

**Target Platform**: Backend web service deployed behind the existing `/bot` global prefix

**Project Type**: Single NestJS backend service

**Performance Goals**: Context save/retrieval/invalidation should be one repository interaction path per operation and avoid unrelated user scans

**Constraints**: Keep types/interfaces/enums in `src/lib/types`; avoid `any`; preserve one context per `waId`; do not persist full WhatsApp transcripts; do not connect live WhatsApp flows in this phase; do not add dependencies

**Scale/Scope**: One internal application layer inside `ReservationContextModule`, with unit tests and docs updates

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

The constitution file still contains placeholder principles and no enforceable project-specific gates. Project-level rules from `AGENTS.md` and the local NestJS guidelines apply instead:

- Keep changes scoped to Phase 2 application logic for reservation context.
- Respect NestJS feature-module boundaries and avoid circular dependencies.
- Keep data access inside `ReservationContextRepository`; use services/use-cases for business orchestration.
- Define every interface, type, and enum under `src/lib/types/reservation-context`.
- Add tests for services/use-cases; keep reusable mocks under `src/modules/reservation-context/test/mocks`.
- Update architecture docs when behavior or module responsibilities change.
- Run `npm run fix`, `npm run test:reservation-context`, and then `npm test` after implementation.

Initial gate status: PASS. No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/004-reservation-context-services/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- reservation-context-application.md
|-- checklists/
|   `-- requirements.md
`-- spec.md
```

### Source Code (repository root)

```text
src/
|-- modules/
|   `-- reservation-context/
|       |-- application/
|       |   |-- cancel-reservation-context.use-case.ts
|       |   |-- cancel-reservation-context.use-case.spec.ts
|       |   |-- expire-reservation-contexts.use-case.ts
|       |   |-- expire-reservation-contexts.use-case.spec.ts
|       |   |-- get-active-reservation-context.use-case.ts
|       |   |-- get-active-reservation-context.use-case.spec.ts
|       |   |-- save-reservation-context.use-case.ts
|       |   `-- save-reservation-context.use-case.spec.ts
|       |-- domain/
|       |   `-- repository/
|       |       |-- reservation-context.repository.ts
|       |       `-- reservation-context.repository.spec.ts
|       |-- entities/
|       |   |-- index.ts
|       |   `-- reservation-context.entity.ts
|       |-- service/
|       |   |-- reservation-context-validation.service.ts
|       |   |-- reservation-context-validation.service.spec.ts
|       |   |-- reservation-context-normalizer.service.ts
|       |   `-- reservation-context-normalizer.service.spec.ts
|       |-- test/
|       |   `-- mocks/
|       |       |-- dependency-mocks.ts
|       |       `-- reservation-context-fixtures.ts
|       `-- reservation-context.module.ts
|-- lib/
|   `-- types/
|       `-- reservation-context/
|           |-- get-active-reservation-context-result.type.ts
|           |-- reservation-context-error-code.enum.ts
|           |-- reservation-context-operation-result.type.ts
|           |-- reservation-context.type.ts
|           |-- save-reservation-context-input.type.ts
|           `-- index.ts
docs/
`-- architecture/
    |-- data-and-state.md
    `-- module-map.md
```

**Structure Decision**: Continue using `ReservationContextModule` as a feature module. Keep repository code in `domain/repository`, add orchestration use-cases in `application`, and keep reusable validation/normalization helpers as injectable services under `service`. Shared contracts remain under `src/lib/types/reservation-context` per repository rules. No controllers or external endpoints are planned for this phase.

## Complexity Tracking

No constitution violations or extra architectural complexity are required. The application/use-case layer adds files but keeps responsibilities separable: repository for persistence, services for validation/normalization, and use-cases for operation-level behavior.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See:

- [data-model.md](./data-model.md)
- [reservation-context-application.md](./contracts/reservation-context-application.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

Status: PASS.

The design stays within `ReservationContextModule`, avoids new dependencies and schema changes, keeps shared contracts under `src/lib/types/reservation-context`, preserves current WhatsApp behavior, and includes focused tests plus architecture doc updates.
