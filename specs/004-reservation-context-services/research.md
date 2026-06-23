# Research: Reservation Context Services

## Decision: Keep Phase 2 as an internal application layer

**Rationale**: The feature prepares reusable capabilities for later WhatsApp create/update/cancel integration. Exposing an HTTP controller now would create a public surface before there is a product workflow that needs it.

**Alternatives considered**:

- Add endpoints for context operations: rejected because the spec requires internal reuse and no user-facing behavior changes.
- Wire directly into reservation strategies now: rejected because this phase explicitly avoids live WhatsApp flow changes.

## Decision: Add use-cases for operation boundaries

**Rationale**: Existing modules use `application/*.use-case.ts` for business operations, and the user explicitly requested use-cases. Separate use-cases make save, lookup, cancel, and expire independently testable.

**Alternatives considered**:

- Put all logic in one service: rejected because it would mix validation, normalization, and operation orchestration.
- Keep all validation in the repository: rejected because repository should focus on persistence after Phase 2 adds application behavior.

## Decision: Add validation and normalization services

**Rationale**: Validation rules are shared by save behavior and tests, while normalization protects consistent `waId` and phone values before persistence. Dedicated services keep use-cases small and make edge cases explicit.

**Alternatives considered**:

- Inline validation in `SaveReservationContextUseCase`: rejected because it would make the use-case harder to evolve and test.
- Use class-validator DTOs: rejected because there is no controller boundary in this phase and no new dependency or HTTP payload contract is needed.

## Decision: Return typed operation results instead of raw exceptions for business absence

**Rationale**: The spec requires callers to distinguish saved context, absence, validation failure, and persistence failure. Typed results under `src/lib/types/reservation-context` make future callers handle these paths without depending on repository internals.

**Alternatives considered**:

- Throw for every validation or absence case: rejected because absence of context is expected behavior for future flows.
- Return raw repository entities only: rejected because callers need stable application-level results and error codes.

## Decision: Keep repository contract from Phase 1 and reduce business validation there during implementation

**Rationale**: Phase 1 already has a working repository contract. Phase 2 should build on it without database changes. During implementation, duplicated business validation can be moved upward or preserved defensively if tests confirm behavior remains stable.

**Alternatives considered**:

- Rewrite repository in this phase: rejected as unnecessary refactor.
- Add new table columns for result state: rejected because the application result state is not persisted data.

## Decision: Use Jest unit tests with local mocks

**Rationale**: Existing repository tests are Jest unit tests and package scripts include `npm run test:reservation-context`. Service/use-case tests should mock the repository and remain fast.

**Alternatives considered**:

- Integration tests against PostgreSQL: rejected because no schema change or persistence behavior change is planned.
- E2E tests through WhatsApp endpoints: rejected because this phase intentionally does not connect live flows.

## Decision: Update architecture docs after implementation

**Rationale**: `docs/architecture/module-map.md` and `docs/architecture/data-and-state.md` already mention `ReservationContextModule`. They need to reflect that the module now owns application services/use-cases, not only storage.

**Alternatives considered**:

- Update only Spec Kit docs: rejected because `AGENTS.md` requires architecture docs when module responsibilities change.
