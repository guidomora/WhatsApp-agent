# Tasks: Billing Responsibility Separation

**Input**: Design documents from `specs/001-billing-layers/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/billing-layer-contract.md](./contracts/billing-layer-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Required by FR-006 and SC-001/SC-002 to prove separated responsibilities and preserved billing behavior.

**Organization**: Tasks are grouped by user story to keep each increment independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks.
- **[Story]**: Maps to user stories from `spec.md`.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Structure)

**Purpose**: Add the shared file structure and reusable contracts needed by all stories.

- [x] T001 Create billing application and repository folders in `src/modules/billing-usage/application/` and `src/modules/billing-usage/domain/repository/`
- [x] T002 [P] Add repository outcome and input types for quota operations in `src/lib/types/billing-usage/billing-usage.type.ts`
- [x] T003 [P] Export new billing repository/use-case support types from `src/lib/types/billing-usage/index.ts`
- [x] T004 [P] Add repository mock factory types and helpers in `src/modules/billing-usage/test/mocks/dependency-mocks.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish repository behavior and test utilities before moving service logic.

**CRITICAL**: No user story work should begin until this phase is complete.

- [x] T005 [P] Add `BillingUsageRepository` test coverage for active subscription lookup in `src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts`
- [x] T006 [P] Add `BillingUsageRepository` test coverage for monthly usage lookup in `src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts`
- [x] T007 [P] Add `BillingUsageRepository` test coverage for idempotent usage event insert outcomes in `src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts`
- [x] T008 [P] Add `BillingUsageRepository` test coverage for quota release delete outcomes in `src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts`
- [x] T009 Implement `BillingUsageRepository` with TypeORM injections and active subscription/monthly usage reads in `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`
- [x] T010 Implement raw insert/update/delete result interpretation helpers inside `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`
- [x] T011 Implement atomic quota consume repository operation in `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`
- [x] T012 Implement atomic quota release repository operation in `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`

**Checkpoint**: Repository behavior is testable independently and can support service/use-case refactors.

---

## Phase 3: User Story 1 - Preserve Billing Behavior While Reducing Responsibilities (Priority: P1) MVP

**Goal**: Keep existing billing results unchanged while moving overloaded logic out of `UsageLimitService`.

**Independent Test**: Run billing service/use-case tests and confirm all supported quota outcomes match the pre-refactor contract.

### Tests for User Story 1

- [x] T013 [P] [US1] Add `CheckWhatsappReservationQuotaUseCase` tests for allowed, missing subscription, inactive plan, and limit reached in `src/modules/billing-usage/application/check-whatsapp-reservation-quota.use-case.spec.ts`
- [x] T014 [P] [US1] Add `ConsumeWhatsappReservationQuotaUseCase` tests for allowed, duplicate idempotent consume, inactive plan, missing subscription, and limit reached in `src/modules/billing-usage/application/consume-whatsapp-reservation-quota.use-case.spec.ts`
- [x] T015 [P] [US1] Add `ReleaseWhatsappReservationQuotaUseCase` tests for released and not released outcomes in `src/modules/billing-usage/application/release-whatsapp-reservation-quota.use-case.spec.ts`
- [x] T016 [P] [US1] Rewrite `UsageLimitService` tests to verify facade delegation and preserved public method results in `src/modules/billing-usage/service/usage-limit.service.spec.ts`

### Implementation for User Story 1

- [x] T017 [US1] Implement `CheckWhatsappReservationQuotaUseCase` using `BillingPeriodService` and `BillingUsageRepository` in `src/modules/billing-usage/application/check-whatsapp-reservation-quota.use-case.ts`
- [x] T018 [US1] Implement `ConsumeWhatsappReservationQuotaUseCase` preserving idempotency and failure reason mapping in `src/modules/billing-usage/application/consume-whatsapp-reservation-quota.use-case.ts`
- [x] T019 [US1] Implement `ReleaseWhatsappReservationQuotaUseCase` preserving release semantics in `src/modules/billing-usage/application/release-whatsapp-reservation-quota.use-case.ts`
- [x] T020 [US1] Refactor `UsageLimitService` into a facade that delegates to billing use-cases in `src/modules/billing-usage/service/usage-limit.service.ts`
- [x] T021 [US1] Register repository and use-case providers while keeping `UsageLimitService` exported in `src/modules/billing-usage/billing-usage.module.ts`

**Checkpoint**: MVP complete; current callers can keep using `UsageLimitService` with unchanged behavior.

---

## Phase 4: User Story 2 - Isolate Data Access Responsibilities (Priority: P2)

**Goal**: Ensure database communication is discoverable in the repository boundary and no longer mixed into service orchestration.

**Independent Test**: Inspect `UsageLimitService` and use-cases to confirm they no longer inject TypeORM repositories or build database queries; repository tests cover data access behavior.

### Tests for User Story 2

- [x] T022 [P] [US2] Add assertions that repository consume operation initializes monthly usage before incrementing quota in `src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts`
- [x] T023 [P] [US2] Add assertions that repository release operation decrements usage only after an event delete returns a period in `src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts`
- [x] T024 [P] [US2] Add assertions that use-case tests do not depend on TypeORM query builder mocks in `src/modules/billing-usage/application/consume-whatsapp-reservation-quota.use-case.spec.ts`

### Implementation for User Story 2

- [x] T025 [US2] Remove direct `DataSource`, `Repository`, query builder, and TypeORM result imports from `src/modules/billing-usage/service/usage-limit.service.ts`
- [x] T026 [US2] Move all subscription query criteria into `BillingUsageRepository` in `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`
- [x] T027 [US2] Move all monthly usage query and update criteria into `BillingUsageRepository` in `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`
- [x] T028 [US2] Move usage event insert/delete criteria into `BillingUsageRepository` in `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`
- [x] T029 [US2] Update billing dependency mocks to support repository tests and use-case tests without leaking TypeORM query builders into use-case specs in `src/modules/billing-usage/test/mocks/dependency-mocks.ts`

**Checkpoint**: Data access is isolated in `domain/repository`, and business flow tests do not need database query details.

---

## Phase 5: User Story 3 - Introduce Use-Case Boundaries Only When They Clarify Flows (Priority: P3)

**Goal**: Keep use-cases for complex quota flows while avoiding unnecessary boundaries for cohesive services such as `BillingPeriodService`.

**Independent Test**: Review touched files and confirm only quota workflows moved into use-cases, while small cohesive services remain unchanged.

### Tests for User Story 3

- [x] T030 [P] [US3] Keep `BillingPeriodService` tests passing without introducing a use-case wrapper in `src/modules/billing-usage/service/billing-period.service.spec.ts`
- [x] T031 [P] [US3] Add service facade tests proving each public method maps to exactly one use-case dependency in `src/modules/billing-usage/service/usage-limit.service.spec.ts`

### Implementation for User Story 3

- [x] T032 [US3] Verify no unnecessary use-case file was added for `BillingPeriodService` and document the decision in `specs/001-billing-layers/tasks.md`
- [x] T033 [US3] Ensure each billing use-case has one clear `execute` entrypoint and no raw database imports in `src/modules/billing-usage/application/check-whatsapp-reservation-quota.use-case.ts`
- [x] T034 [US3] Ensure each billing use-case has one clear `execute` entrypoint and no raw database imports in `src/modules/billing-usage/application/consume-whatsapp-reservation-quota.use-case.ts`
- [x] T035 [US3] Ensure each billing use-case has one clear `execute` entrypoint and no raw database imports in `src/modules/billing-usage/application/release-whatsapp-reservation-quota.use-case.ts`

**Checkpoint**: Use-case boundaries exist only where they reduce service responsibility and improve flow clarity.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and cleanup across all stories.

- [x] T036 [P] Update the billing module entry in `docs/architecture/module-map.md` if the implemented ownership boundaries changed documented files
- [x] T037 [P] Run formatting and lint fixes with `npm run fix` and review changes in `src/modules/billing-usage/service/usage-limit.service.ts`
- [x] T038 Run focused billing tests with `npm test -- src/modules/billing-usage` and record results in `specs/001-billing-layers/quickstart.md`
- [x] T039 Run the full test suite with `npm test` and record results in `specs/001-billing-layers/quickstart.md`
- [x] T040 Review final diff for unrelated changes and scope compliance in `specs/001-billing-layers/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational; MVP scope.
- **US2 (Phase 4)**: Depends on Foundational and can proceed after the repository API is stable; should be validated after US1 facade behavior.
- **US3 (Phase 5)**: Depends on US1 use-case files existing.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 and delivers the MVP.
- **US2 (P2)**: Starts after Phase 2; can overlap with US1 after repository contracts are settled, but final validation depends on US1 behavior preservation.
- **US3 (P3)**: Starts after US1 creates the use-case boundaries.

### Within Each User Story

- Write story tests first and confirm they fail for the missing refactor.
- Implement use-cases before the service facade.
- Keep repository query details out of use-cases.
- Register providers after implementation files exist.
- Validate each checkpoint before moving to the next priority.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001.
- T005, T006, T007, and T008 can run in parallel because they add separate repository test cases.
- T013, T014, T015, and T016 can run in parallel because they target different test files or different service test scope.
- T022, T023, and T024 can run in parallel after repository/use-case files exist.
- T030 and T031 can run in parallel.
- T036 and T037 can run in parallel after implementation is complete.

---

## Parallel Example: User Story 1

```text
Task: "Add CheckWhatsappReservationQuotaUseCase tests in src/modules/billing-usage/application/check-whatsapp-reservation-quota.use-case.spec.ts"
Task: "Add ConsumeWhatsappReservationQuotaUseCase tests in src/modules/billing-usage/application/consume-whatsapp-reservation-quota.use-case.spec.ts"
Task: "Add ReleaseWhatsappReservationQuotaUseCase tests in src/modules/billing-usage/application/release-whatsapp-reservation-quota.use-case.spec.ts"
Task: "Rewrite UsageLimitService facade tests in src/modules/billing-usage/service/usage-limit.service.spec.ts"
```

## Parallel Example: User Story 2

```text
Task: "Add repository monthly usage ordering assertions in src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts"
Task: "Add repository release period assertions in src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts"
Task: "Add use-case isolation assertions in src/modules/billing-usage/application/consume-whatsapp-reservation-quota.use-case.spec.ts"
```

## Parallel Example: User Story 3

```text
Task: "Keep BillingPeriodService tests passing in src/modules/billing-usage/service/billing-period.service.spec.ts"
Task: "Add facade-to-use-case mapping tests in src/modules/billing-usage/service/usage-limit.service.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 repository foundation.
3. Complete Phase 3 US1.
4. Stop and validate with `npm test -- src/modules/billing-usage`.

### Incremental Delivery

1. Repository foundation isolates persistence behavior.
2. US1 preserves current billing behavior through the service facade.
3. US2 completes data-access separation and removes database details from service/use-case callers.
4. US3 confirms only useful use-case boundaries were introduced.
5. Polish runs `npm run fix`, focused tests, and full tests.

### Notes

- `[P]` tasks are safe to run in parallel only when their prerequisite phase is available.
- `[US1]`, `[US2]`, and `[US3]` labels map directly to `spec.md` user stories.
- Do not add a use-case around `BillingPeriodService`; it is intentionally kept as a cohesive service.
- Do not add migrations or persisted fields; this feature reorganizes responsibilities only.
