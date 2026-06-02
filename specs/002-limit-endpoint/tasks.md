# Tasks: Agent Reservation Limit Visibility

**Input**: Design documents from `specs/002-limit-endpoint/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/billing-usage-quota-endpoint.md, quickstart.md

**Tests**: Required by FR-010 and AGENTS.md. Add tests before implementation for the affected use-case, controller, guard move, and any repository changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: Maps to user stories from `spec.md`
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the shared security location and align the implementation plan with the requested module structure.

- [x] T001 Create `src/common/guards/` directory for shared guards
- [x] T002 Move `src/modules/reservations/guards/internal-api-token.guard.ts` to `src/common/guards/internal-api-token.guard.ts`
- [x] T003 Move `src/modules/reservations/guards/internal-api-token.guard.spec.ts` to `src/common/guards/internal-api-token.guard.spec.ts`
- [x] T004 Update imports of `InternalApiTokenGuard` in `src/modules/reservations/controller/reservations.controller.ts`, `src/modules/reservations/reservations.module.ts`, and `src/modules/reservations/controller/reservations.controller.spec.ts`
- [x] T005 Update relative imports inside `src/common/guards/internal-api-token.guard.spec.ts` after the file move

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared billing quota contracts and verify the repository read path before any user story implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 [P] Add quota summary state/types to `src/lib/types/billing-usage/billing-usage.type.ts`
- [x] T007 [P] Ensure billing usage types remain exported through `src/lib/types/billing-usage/index.ts` and `src/lib/types/index.ts`
- [x] T008 Review existing `findActiveSubscription` and `findMonthlyUsage` methods in `src/modules/billing-usage/domain/repository/billing-usage.repository.ts` and add a focused read method only if these methods cannot provide the endpoint data
- [x] T009 [P] Add or update repository tests for any new quota read method in `src/modules/billing-usage/domain/repository/billing-usage.repository.spec.ts`

**Checkpoint**: Shared guard location, imports, billing quota types, and repository read strategy are ready.

---

## Phase 3: User Story 1 - Show Remaining Agent Reservation Quota (Priority: P1) MVP

**Goal**: Frontend can request a customer's current agent reservation quota and receive plan limit, used amount, remaining amount, overage, and billing period data.

**Independent Test**: Request the quota summary for an account with active plan usage and verify a complete response with non-negative `remaining`.

### Tests for User Story 1

- [x] T010 [P] [US1] Add finite quota summary tests in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts`
- [x] T011 [P] [US1] Add controller success response test for `GET /billing-usage/accounts/:accountId/whatsapp-reservation-quota` in `src/modules/billing-usage/controller/billing-usage.controller.spec.ts`

### Implementation for User Story 1

- [x] T012 [P] [US1] Create path param DTO `BillingAccountParamDto` in `src/modules/billing-usage/dto/billing-account-param.dto.ts`
- [x] T013 [P] [US1] Create response DTO `BillingQuotaSummaryResponseDto` in `src/modules/billing-usage/dto/billing-quota-summary-response.dto.ts`
- [x] T014 [US1] Implement `GetWhatsappReservationQuotaSummaryUseCase` in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.ts`
- [x] T015 [US1] Create `BillingUsageController` with protected `GET accounts/:accountId/whatsapp-reservation-quota` in `src/modules/billing-usage/controller/billing-usage.controller.ts`
- [x] T016 [US1] Register `BillingUsageController`, `GetWhatsappReservationQuotaSummaryUseCase`, and `InternalApiTokenGuard` in `src/modules/billing-usage/billing-usage.module.ts`

**Checkpoint**: User Story 1 is independently functional and returns quota numbers for active finite plans.

---

## Phase 4: User Story 2 - Represent Quota State Clearly in the Frontend (Priority: P2)

**Goal**: Response includes display-ready states for available, near-limit, exhausted, over-limit, unavailable, and future-compatible unlimited scenarios.

**Independent Test**: Validate quota summaries for each state and confirm the frontend does not need to recalculate business state from raw numbers.

### Tests for User Story 2

- [x] T017 [P] [US2] Add available, near-limit, exhausted, and over-limit state tests in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts`
- [x] T018 [P] [US2] Add unavailable subscription, inactive plan, missing usage, and future-compatible unlimited state tests in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts`
- [x] T019 [P] [US2] Add Swagger/DTO shape assertions for state fields in `src/modules/billing-usage/controller/billing-usage.controller.spec.ts`

### Implementation for User Story 2

- [x] T020 [US2] Add quota state mapping and near-limit threshold logic in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.ts`
- [x] T021 [US2] Ensure `BillingQuotaSummaryResponseDto` includes `state`, `unavailableReason`, `remaining`, and `overage` fields in `src/modules/billing-usage/dto/billing-quota-summary-response.dto.ts`
- [x] T022 [US2] Ensure unavailable cases return display-safe data without leaking quota numbers in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.ts`

**Checkpoint**: User Story 2 is independently functional and all display states are covered.

---

## Phase 5: User Story 3 - Keep Displayed Quota Consistent With Agent Enforcement (Priority: P3)

**Goal**: Frontend quota summary uses the same active subscription, period, and monthly usage rules as the agent-side WhatsApp quota enforcement.

**Independent Test**: Compare summary results against the existing check use-case scenarios: allowed when quota remains, exhausted when limit is reached.

### Tests for User Story 3

- [x] T023 [P] [US3] Add consistency tests comparing summary behavior with `CheckWhatsappReservationQuotaUseCase` fixtures in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts`
- [x] T024 [P] [US3] Add guard rejection tests for missing and invalid internal token in `src/modules/billing-usage/controller/billing-usage.controller.spec.ts`
- [x] T025 [P] [US3] Verify moved guard behavior remains covered in `src/common/guards/internal-api-token.guard.spec.ts`

### Implementation for User Story 3

- [x] T026 [US3] Reuse `BillingPeriodService`, `findActiveSubscription`, and `findMonthlyUsage` in `src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.ts`
- [x] T027 [US3] Apply `@UseGuards(InternalApiTokenGuard)`, `@ApiSecurity('internal-api-token')`, and `@ApiHeader` in `src/modules/billing-usage/controller/billing-usage.controller.ts`
- [x] T028 [US3] Update any stale imports from `src/modules/reservations/guards/internal-api-token.guard` to `src/common/guards/internal-api-token.guard`

**Checkpoint**: User Story 3 is independently functional and summary visibility matches enforcement rules.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final cleanup across the feature.

- [x] T029 [P] Update `docs/architecture/module-map.md` to include the new billing usage endpoint and common guard location
- [x] T030 [P] Update `docs/architecture/security-and-resilience.md` to document the billing usage internal endpoint protected by `x-internal-api-token`
- [X] T031 Run `npm run fix` and address any lint/format errors
- [X] T032 Run focused tests with `npm test -- src/modules/billing-usage src/common/guards src/modules/reservations` and fix failures
- [X] T033 Run broader existing tests if focused changes affect shared guard behavior with `npm test -- --runInBand`
- [X] T034 Validate quickstart manually or through controller tests against `specs/002-limit-endpoint/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and can build on the use-case from US1.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and can validate consistency after US1 use-case exists.
- **Polish (Phase 6)**: Depends on selected user stories being implemented.

### User Story Dependencies

- **US1 (P1)**: Requires shared guard and billing types from Phase 1/2. No dependency on US2 or US3.
- **US2 (P2)**: Uses the US1 summary use-case and response DTO, then expands state coverage.
- **US3 (P3)**: Uses the US1 summary use-case and validates consistency/security.

### Within Each User Story

- Write tests before implementation tasks.
- DTOs/types before use-case/controller wiring.
- Use-case before controller integration.
- Controller and module registration before endpoint validation.

## Parallel Opportunities

- T006 and T009 can run in parallel after Phase 1 if repository strategy is known.
- T010 and T011 can run in parallel because they touch different test files.
- T012 and T013 can run in parallel because they create different DTO files.
- T017, T018, and T019 can run in parallel because they cover distinct state/shape concerns.
- T023, T024, and T025 can run in parallel because they validate different consistency/security surfaces.
- T029 and T030 can run in parallel because they update different documentation files.

## Parallel Example: User Story 1

```text
Task: "T010 [P] [US1] Add finite quota summary tests in src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts"
Task: "T011 [P] [US1] Add controller success response test for GET /billing-usage/accounts/:accountId/whatsapp-reservation-quota in src/modules/billing-usage/controller/billing-usage.controller.spec.ts"
Task: "T012 [P] [US1] Create path param DTO BillingAccountParamDto in src/modules/billing-usage/dto/billing-account-param.dto.ts"
Task: "T013 [P] [US1] Create response DTO BillingQuotaSummaryResponseDto in src/modules/billing-usage/dto/billing-quota-summary-response.dto.ts"
```

## Parallel Example: User Story 2

```text
Task: "T017 [P] [US2] Add available, near-limit, exhausted, and over-limit state tests in src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts"
Task: "T018 [P] [US2] Add unavailable subscription, inactive plan, missing usage, and future-compatible unlimited state tests in src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts"
Task: "T019 [P] [US2] Add Swagger/DTO shape assertions for state fields in src/modules/billing-usage/controller/billing-usage.controller.spec.ts"
```

## Parallel Example: User Story 3

```text
Task: "T023 [P] [US3] Add consistency tests comparing summary behavior with CheckWhatsappReservationQuotaUseCase fixtures in src/modules/billing-usage/application/get-whatsapp-reservation-quota-summary.use-case.spec.ts"
Task: "T024 [P] [US3] Add guard rejection tests for missing and invalid internal token in src/modules/billing-usage/controller/billing-usage.controller.spec.ts"
Task: "T025 [P] [US3] Verify moved guard behavior remains covered in src/common/guards/internal-api-token.guard.spec.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 to move the guard to `src/common/guards` and update reservations imports.
2. Complete Phase 2 to define quota types and confirm repository read methods.
3. Complete Phase 3 to expose the secure billing usage endpoint with finite-plan quota summary.
4. Stop and validate with the US1 tests and a valid-token request.

### Incremental Delivery

1. Deliver US1 for basic quota visibility.
2. Add US2 for display-ready states and edge cases.
3. Add US3 for consistency with enforcement and security validation.
4. Finish with documentation, `npm run fix`, and focused/broader tests.

### Notes

- Keep all new interfaces, types, and enums under `src/lib/types/billing-usage`.
- Do not add new dependencies unless implementation discovers a hard requirement.
- Do not change quota consumption, release, or enforcement behavior.
- Do not leave imports pointing to the old reservations guard path.
