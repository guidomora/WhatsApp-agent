# Implementation Plan: Reservation Context Storage

**Branch**: `feat/reservation-context-storage` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-reservation-context-storage/spec.md`

## Summary

Add durable storage for a structured snapshot of the latest actionable WhatsApp reservation context per user. The implementation will introduce a dedicated `ReservationContextModule` with a PostgreSQL-backed TypeORM entity, migration, repository, and shared types, without changing live conversational create/update/cancel behavior in this phase.

## Technical Context

**Language/Version**: TypeScript with NestJS backend runtime

**Primary Dependencies**: NestJS, TypeORM, PostgreSQL, Jest

**Storage**: PostgreSQL via TypeORM with `synchronize: false`; schema changes must be delivered through migrations

**Testing**: Jest unit tests through existing `npm test` workflow; formatting/linting through `npm run fix`

**Target Platform**: Backend web service deployed behind the existing `/bot` global prefix

**Project Type**: Single NestJS backend service

**Performance Goals**: Active context lookup should use indexed fields and avoid scanning unrelated user contexts

**Constraints**: No full WhatsApp transcript persistence; at most one context per `waId`; no `accountId` in this phase; no cleanup scheduler and no live flow integration in this phase

**Scale/Scope**: One internal storage module for latest WhatsApp reservation context snapshots

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

The constitution file still contains placeholder principles and no enforceable project-specific gates. Project-level rules from `AGENTS.md` apply instead:

- Keep changes scoped to Phase 1 storage.
- Respect NestJS module boundaries.
- Define interfaces/types/enums under `src/lib/types`.
- Use migrations for PostgreSQL schema changes.
- Do not introduce new dependencies.
- Do not connect the new module to live reservation flows in this phase.
- Run `npm run fix` after implementation and run relevant tests.

Initial gate status: PASS. No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/003-reservation-context-storage/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- reservation-context-repository.md
|-- checklists/
|   `-- requirements.md
`-- spec.md
```

### Source Code (repository root)

```text
src/
|-- modules/
|   `-- reservation-context/
|       |-- entities/
|       |   |-- index.ts
|       |   `-- reservation-context.entity.ts
|       |-- domain/
|       |   `-- repository/
|       |       |-- reservation-context.repository.ts
|       |       `-- reservation-context.repository.spec.ts
|       |-- test/
|       |   `-- mocks/
|       |       `-- dependency-mocks.ts
|       `-- reservation-context.module.ts
|-- lib/
|   `-- types/
|       |-- reservation-context/
|       |   |-- index.ts
|       |   |-- reservation-context-status.enum.ts
|       |   `-- reservation-context.type.ts
|       `-- index.ts
`-- database/
    `-- migrations/
        `-- 20260622000000-CreateReservationContextsTable.ts
```

**Structure Decision**: Implement a dedicated `ReservationContextModule` because this state is persistent operational context. It does not belong to `billing-usage`, which owns quota/platform data, and it does not belong to `cache-context`, which owns expiring runtime conversation state.

## Complexity Tracking

No constitution violations or extra architectural complexity are required. A separate module adds a small amount of structure, but it prevents coupling persistent reservation context to billing, cache, or conversational strategy code.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See:

- [data-model.md](./data-model.md)
- [reservation-context-repository.md](./contracts/reservation-context-repository.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

Status: PASS.

The design remains scoped to storage-only Phase 1 work, uses the existing NestJS/TypeORM/PostgreSQL stack, avoids new dependencies, keeps shared types under `src/lib/types`, and preserves current user-facing conversation behavior.
