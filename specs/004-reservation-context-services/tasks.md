# Tasks: Reservation Context Services

**Input**: Design documents from `specs/004-reservation-context-services/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Tests are included because the plan explicitly requires focused unit tests for services/use-cases and existing project rules require tests for added code.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently after the foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches a different file and does not depend on incomplete tasks.
- **[Story]**: Maps the task to the user story from `spec.md`.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Structure)

**Purpose**: Create the module structure needed by all application-layer work.

- [ ] T001 Create `application/` and `service/` directories under `src/modules/reservation-context/`
- [ ] T002 Confirm `specs/004-reservation-context-services/quickstart.md` acceptance checks match the current plan before implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, fixtures, and mocks required before implementing any story.

**CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T003 [P] Add `ReservationContextErrorCode` enum in `src/lib/types/reservation-context/reservation-context-error-code.enum.ts`
- [ ] T004 [P] Add operation result types in `src/lib/types/reservation-context/reservation-context-operation-result.type.ts`
- [ ] T005 [P] Add active lookup result types in `src/lib/types/reservation-context/get-active-reservation-context-result.type.ts`
- [ ] T006 [P] Add save input type alias in `src/lib/types/reservation-context/save-reservation-context-input.type.ts`
- [ ] T007 Update exports for all new reservation-context types in `src/lib/types/reservation-context/index.ts`
- [ ] T008 [P] Add reusable reservation-context fixtures in `src/modules/reservation-context/test/mocks/reservation-context-fixtures.ts`
- [ ] T009 Extend repository mocks for use-case tests in `src/modules/reservation-context/test/mocks/dependency-mocks.ts`

**Checkpoint**: Shared contracts and reusable test data are ready.

---

## Phase 3: User Story 1 - Guardar contexto accionable desde una reserva confirmada (Priority: P1) MVP

**Goal**: Validate, normalize, and save a complete reservation context as the latest active context for a WhatsApp user.

**Independent Test**: Provide complete reservation data and verify the save use-case returns a saved active context; provide invalid data and verify persistence is not called.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add normalizer unit tests in `src/modules/reservation-context/service/reservation-context-normalizer.service.spec.ts`
- [ ] T011 [P] [US1] Add validation unit tests for required fields, quantity, and time windows in `src/modules/reservation-context/service/reservation-context-validation.service.spec.ts`
- [ ] T012 [P] [US1] Add save use-case unit tests for valid save, replacement behavior, validation failure, and persistence failure in `src/modules/reservation-context/application/save-reservation-context.use-case.spec.ts`

### Implementation for User Story 1

- [ ] T013 [US1] Implement text trimming and identifier normalization in `src/modules/reservation-context/service/reservation-context-normalizer.service.ts`
- [ ] T014 [US1] Implement save input validation with stable error codes in `src/modules/reservation-context/service/reservation-context-validation.service.ts`
- [ ] T015 [US1] Implement save orchestration in `src/modules/reservation-context/application/save-reservation-context.use-case.ts`
- [ ] T016 [US1] Register and export save use-case plus validation/normalizer services in `src/modules/reservation-context/reservation-context.module.ts`

**Checkpoint**: User Story 1 is functional and testable with `npm run test:reservation-context`.

---

## Phase 4: User Story 2 - Recuperar contexto para acciones posteriores (Priority: P2)

**Goal**: Return a typed active context result for a WhatsApp user or explicit absence when no actionable context exists.

**Independent Test**: Query with an active context, missing context, and normalized identifier input; verify only the active case returns reservation data.

### Tests for User Story 2

- [ ] T017 [P] [US2] Add active lookup use-case tests for found context, missing context, normalized `waId`, and repository failure in `src/modules/reservation-context/application/get-active-reservation-context.use-case.spec.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Implement active context lookup result mapping in `src/modules/reservation-context/application/get-active-reservation-context.use-case.ts`
- [ ] T019 [US2] Register and export active lookup use-case in `src/modules/reservation-context/reservation-context.module.ts`

**Checkpoint**: User Story 2 works independently after foundational tasks and can be validated with focused tests.

---

## Phase 5: User Story 3 - Invalidar contexto cuando deja de ser accionable (Priority: P3)

**Goal**: Mark one user's context as cancelled and mark ended active contexts as expired.

**Independent Test**: Cancel an existing and missing context, then expire contexts before a cutoff; verify affected counts and no context creation.

### Tests for User Story 3

- [ ] T020 [P] [US3] Add cancel use-case tests for affected row count, missing context no-op, normalized `waId`, and repository failure in `src/modules/reservation-context/application/cancel-reservation-context.use-case.spec.ts`
- [ ] T021 [P] [US3] Add expire use-case tests for valid cutoff, invalid cutoff, affected row count, and repository failure in `src/modules/reservation-context/application/expire-reservation-contexts.use-case.spec.ts`

### Implementation for User Story 3

- [ ] T022 [US3] Implement cancellation orchestration in `src/modules/reservation-context/application/cancel-reservation-context.use-case.ts`
- [ ] T023 [US3] Implement expiration orchestration and cutoff validation in `src/modules/reservation-context/application/expire-reservation-contexts.use-case.ts`
- [ ] T024 [US3] Register and export cancel and expire use-cases in `src/modules/reservation-context/reservation-context.module.ts`

**Checkpoint**: User Story 3 invalidation behavior is independently testable.

---

## Phase 6: User Story 4 - Proteger el limite de privacidad del contexto (Priority: P4)

**Goal**: Preserve the Phase 1 privacy boundary by accepting only structured reservation data and an optional short summary, never a full conversation transcript.

**Independent Test**: Attempt to save a context with only structured fields and a short summary; verify the saved input contains no full transcript field or transcript-shaped payload.

### Tests for User Story 4

- [ ] T025 [P] [US4] Add privacy-focused save use-case tests that assert only structured context fields are passed to persistence in `src/modules/reservation-context/application/save-reservation-context.use-case.spec.ts`
- [ ] T026 [P] [US4] Add validation tests for rejecting overlong or transcript-shaped `lastConversationSummary` values in `src/modules/reservation-context/service/reservation-context-validation.service.spec.ts`

### Implementation for User Story 4

- [ ] T027 [US4] Add summary privacy validation rules in `src/modules/reservation-context/service/reservation-context-validation.service.ts`
- [ ] T028 [US4] Ensure save use-case maps only allowed structured fields before repository calls in `src/modules/reservation-context/application/save-reservation-context.use-case.ts`

**Checkpoint**: Privacy boundary is covered by tests and save behavior remains scoped to structured context.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and verification across all stories.

- [ ] T029 [P] Update `ReservationContextModule` responsibilities and file list in `docs/architecture/module-map.md`
- [ ] T030 [P] Update PostgreSQL/context consistency notes in `docs/architecture/data-and-state.md`
- [ ] T031 Review `src/modules/reservation-context/domain/repository/reservation-context.repository.ts` and move duplicated business validation only if service/use-case coverage makes it redundant
- [ ] T032 Run `npm run fix` and correct any lint or formatting errors in touched files
- [ ] T033 Run `npm run test:reservation-context` and fix any failing reservation-context tests
- [ ] T034 Run `npm test` and fix any regressions caused by this feature
- [ ] T035 Verify `specs/004-reservation-context-services/quickstart.md` acceptance checks against the implemented behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion.
- **Polish (Phase 7)**: Depends on selected user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational; MVP scope.
- **User Story 2 (P2)**: Starts after Foundational; can run independently but reuses normalizer from US1 if already implemented.
- **User Story 3 (P3)**: Starts after Foundational; independent of US1/US2 except shared result types.
- **User Story 4 (P4)**: Starts after US1 because it strengthens save validation and mapping.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Implement service/use-case code after story tests exist.
- Register providers in `reservation-context.module.ts` after implementation exists.
- Validate each story with `npm run test:reservation-context` before moving to lower-priority stories when working sequentially.

---

## Parallel Opportunities

- T003, T004, T005, T006, T008, and T009 can run in parallel after setup.
- T010, T011, and T012 can run in parallel for US1.
- T020 and T021 can run in parallel for US3.
- T029 and T030 can run in parallel after implementation decisions are stable.
- Different developers can work on US2 and US3 in parallel after Foundational if they coordinate edits to `reservation-context.module.ts`.

---

## Parallel Example: User Story 1

```bash
Task: "Add normalizer unit tests in src/modules/reservation-context/service/reservation-context-normalizer.service.spec.ts"
Task: "Add validation unit tests in src/modules/reservation-context/service/reservation-context-validation.service.spec.ts"
Task: "Add save use-case unit tests in src/modules/reservation-context/application/save-reservation-context.use-case.spec.ts"
```

---

## Parallel Example: User Story 3

```bash
Task: "Add cancel use-case tests in src/modules/reservation-context/application/cancel-reservation-context.use-case.spec.ts"
Task: "Add expire use-case tests in src/modules/reservation-context/application/expire-reservation-contexts.use-case.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for save behavior.
3. Run `npm run test:reservation-context`.
4. Stop and validate that a valid context can be saved and invalid context does not reach persistence.

### Incremental Delivery

1. Add US1 save behavior.
2. Add US2 lookup behavior.
3. Add US3 invalidation behavior.
4. Add US4 privacy hardening.
5. Update docs and run full verification.

### Implementation Notes

- Keep all interfaces, types, and enums under `src/lib/types/reservation-context`.
- Keep reusable mocks in `src/modules/reservation-context/test/mocks`.
- Do not add controllers, routes, migrations, dependencies, or live WhatsApp flow integration in this feature.
- Avoid direct TypeORM access from services/use-cases; use `ReservationContextRepository`.
