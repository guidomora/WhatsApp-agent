# Tasks: Reservation Context Storage

**Input**: Design documents from `specs/003-reservation-context-storage/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/reservation-context-repository.md`, `quickstart.md`

**Tests**: Tests are included because repository unit tests were explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other marked tasks when they touch different files and do not depend on incomplete tasks
- **[Story]**: Maps the task to the user story from `spec.md`
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the module skeleton and shared type locations required by all stories.

- [x] T001 Create reservation-context directories in `src/modules/reservation-context/entities/`, `src/modules/reservation-context/domain/repository/`, `src/modules/reservation-context/test/mocks/`, and `src/lib/types/reservation-context/`
- [x] T002 [P] Create reservation-context type barrel in `src/lib/types/reservation-context/index.ts` and export it from `src/lib/types/index.ts`
- [x] T003 [P] Create reservation-context entity barrel in `src/modules/reservation-context/entities/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the shared model, schema, and module wiring that all repository behavior depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create `ReservationContextStatus` enum with `active`, `cancelled`, and `expired` in `src/lib/types/reservation-context/reservation-context-status.enum.ts`
- [x] T005 Create repository input/result types for `upsertActiveContext`, `findActiveByWaId`, `markCancelledByWaId`, and `markExpiredBefore` in `src/lib/types/reservation-context/reservation-context.type.ts`
- [x] T006 Create `ReservationContext` TypeORM entity mapped to `reservation_contexts` in `src/modules/reservation-context/entities/reservation-context.entity.ts`
- [x] T007 Create `ReservationContextModule` with `TypeOrmModule.forFeature([ReservationContext])` and repository provider in `src/modules/reservation-context/reservation-context.module.ts`
- [x] T008 Create migration for `reservation_contexts`, enum status, unique `waId`, and `(status, reservationEndsAt)` index in `src/database/migrations/20260622000000-CreateReservationContextsTable.ts`
- [x] T009 Create repository test dependency mocks for TypeORM repository/query-builder behavior in `src/modules/reservation-context/test/mocks/dependency-mocks.ts`
- [x] T010 Create `ReservationContextRepository` skeleton with constructor injection and method signatures in `src/modules/reservation-context/domain/repository/reservation-context.repository.ts`

**Checkpoint**: Foundation ready - user story repository behavior can now be implemented and tested.

---

## Phase 3: User Story 1 - Registrar contexto persistente de reserva (Priority: P1) MVP

**Goal**: Save a complete latest reservation context for one WhatsApp user and replace any previous context for that same `waId`.

**Independent Test**: Saving a complete context for a new `waId` creates one active context; saving another context for the same `waId` replaces the prior values and keeps exactly one row for that `waId`.

### Tests for User Story 1

- [x] T011 [US1] Add failing tests for `upsertActiveContext` create/replace/status behavior in `src/modules/reservation-context/domain/repository/reservation-context.repository.spec.ts`

### Implementation for User Story 1

- [x] T012 [US1] Implement `upsertActiveContext` with `status = active`, conflict on `waId`, timestamp update, and saved entity return in `src/modules/reservation-context/domain/repository/reservation-context.repository.ts`
- [x] T013 [US1] Run focused repository tests for save/replace behavior in `src/modules/reservation-context/domain/repository/reservation-context.repository.spec.ts` with `npm test -- src/modules/reservation-context`

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Recuperar solo contexto utilizable (Priority: P2)

**Goal**: Retrieve only an active, not-yet-ended context for a WhatsApp user.

**Independent Test**: Lookup returns a context when `waId` matches, status is active, and `reservationEndsAt` is after `now`; lookup returns `null` for missing, cancelled, expired, or already-ended contexts.

### Tests for User Story 2

- [x] T014 [US2] Add failing tests for `findActiveByWaId` active/not-ended and null cases in `src/modules/reservation-context/domain/repository/reservation-context.repository.spec.ts`

### Implementation for User Story 2

- [x] T015 [US2] Implement `findActiveByWaId` filtering by `waId`, `active` status, and `reservationEndsAt > now` in `src/modules/reservation-context/domain/repository/reservation-context.repository.ts`
- [x] T016 [US2] Run focused repository tests for active lookup behavior in `src/modules/reservation-context/domain/repository/reservation-context.repository.spec.ts` with `npm test -- src/modules/reservation-context`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Desactivar contextos no accionables (Priority: P3)

**Goal**: Mark contexts as cancelled or expired so they are no longer returned as active context.

**Independent Test**: Cancelling a user's context prevents active lookup from returning it; expiring active contexts before a cutoff prevents active lookup from returning those rows while leaving newer active rows untouched.

### Tests for User Story 3

- [x] T017 [US3] Add failing tests for `markCancelledByWaId` and `markExpiredBefore` affected-row behavior in `src/modules/reservation-context/domain/repository/reservation-context.repository.spec.ts`

### Implementation for User Story 3

- [x] T018 [US3] Implement `markCancelledByWaId` status update and affected count in `src/modules/reservation-context/domain/repository/reservation-context.repository.ts`
- [x] T019 [US3] Implement `markExpiredBefore` for active rows with `reservationEndsAt < cutoffDate` in `src/modules/reservation-context/domain/repository/reservation-context.repository.ts`
- [x] T020 [US3] Run focused repository tests for cancellation and expiration behavior in `src/modules/reservation-context/domain/repository/reservation-context.repository.spec.ts` with `npm test -- src/modules/reservation-context`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final consistency checks.

- [x] T021 [P] Update PostgreSQL schema documentation for `reservation_contexts` in `docs/architecture/postgresql-schema.md`
- [x] T022 [P] Update data/state documentation to mention persisted reservation context in PostgreSQL in `docs/architecture/data-and-state.md`
- [x] T023 [P] Update module map documentation for `ReservationContextModule` in `docs/architecture/module-map.md`
- [X] T024 Run formatting and linting for `src/modules/reservation-context/`, `src/lib/types/reservation-context/`, and `src/database/migrations/20260622000000-CreateReservationContextsTable.ts` with `npm run fix`
- [X] T025 Run full test suite for `src/` with `npm test`
- [X] T026 Verify no live WhatsApp create/update/cancel flow integration was added in `src/modules/reservations/` and `src/modules/whatsapp/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundation.
- **User Story 2 (Phase 4)**: Depends on Foundation and can be implemented after or alongside US1 if repository file conflicts are coordinated.
- **User Story 3 (Phase 5)**: Depends on Foundation and can be implemented after or alongside US1/US2 if repository file conflicts are coordinated.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: First MVP slice; no dependency on US2 or US3.
- **US2 (P2)**: Uses the same repository and entity; logically independent from US1 but benefits from the saved-context behavior.
- **US3 (P3)**: Uses the same repository and entity; independent deactivation behavior.

### Within Each User Story

- Write the repository tests first and confirm they fail.
- Implement the repository method.
- Run focused tests for `src/modules/reservation-context`.
- Complete each checkpoint before moving to the next priority if working sequentially.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- Documentation tasks T021, T022, and T023 can run in parallel after implementation.
- US1, US2, and US3 tests can be drafted in parallel only if contributors coordinate edits to `reservation-context.repository.spec.ts`.
- US1, US2, and US3 implementation can proceed in parallel only if contributors coordinate edits to `reservation-context.repository.ts`.

---

## Parallel Example: Setup

```text
Task: "T002 Create reservation-context type barrel in src/lib/types/reservation-context/index.ts and export it from src/lib/types/index.ts"
Task: "T003 Create reservation-context entity barrel in src/modules/reservation-context/entities/index.ts"
```

## Parallel Example: Polish

```text
Task: "T021 Update PostgreSQL schema documentation for reservation_contexts in docs/architecture/postgresql-schema.md"
Task: "T022 Update data/state documentation to mention persisted reservation context in PostgreSQL in docs/architecture/data-and-state.md"
Task: "T023 Update module map documentation for ReservationContextModule in docs/architecture/module-map.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational model/schema/module tasks.
3. Complete Phase 3 `upsertActiveContext`.
4. Validate with `npm test -- src/modules/reservation-context`.
5. Stop and review before adding lookup/deactivation behavior.

### Incremental Delivery

1. Foundation ready: module, types, entity, migration, repository skeleton.
2. US1: Save/replace active context.
3. US2: Retrieve only usable active context.
4. US3: Mark cancelled/expired contexts.
5. Polish: docs, `npm run fix`, focused tests, full suite.

### Notes

- `[P]` tasks touch separate files and can run in parallel when dependencies are met.
- Story labels map to `spec.md` user stories.
- Keep Phase 1 storage-only: do not inject this module into reservation strategies yet.
- Do not add `accountId` in this phase.
- Do not add cleanup scheduler or deletion of expired contexts in this phase.
