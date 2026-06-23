# Quickstart: Reservation Context Services

## Scope

This phase adds application services, use-cases, shared types, tests, and architecture docs for `ReservationContextModule`.

It must not connect the capability to live WhatsApp create/update/cancel flows yet.

## Expected Implementation

1. Add shared result/input/error types under `src/lib/types/reservation-context/`.
2. Add `ReservationContextNormalizerService`.
3. Add `ReservationContextValidationService`.
4. Add `SaveReservationContextUseCase`.
5. Add `GetActiveReservationContextUseCase`.
6. Add `CancelReservationContextUseCase`.
7. Add `ExpireReservationContextsUseCase`.
8. Register and export the application use-cases from `ReservationContextModule`.
9. Keep repository access in `ReservationContextRepository`; avoid direct TypeORM use from services/use-cases.
10. Add focused tests for normalizer, validation service, and every use-case.
11. Add reusable fixtures/mocks under `src/modules/reservation-context/test/mocks`.
12. Update `docs/architecture/module-map.md` and `docs/architecture/data-and-state.md` to reflect the new application-layer responsibilities.

## Verification Commands

Run formatting and linting after code changes:

```bash
npm run fix
```

Run focused tests:

```bash
npm run test:reservation-context
```

Run the full suite when focused tests pass:

```bash
npm test
```

## Acceptance Checks

- A valid save input produces one active latest context for a WhatsApp user.
- Invalid save input does not call persistence and returns a validation result.
- Active lookup returns context only when it is active and not ended.
- Missing, cancelled, expired, or already-ended context returns explicit absence.
- Cancellation by `waId` is idempotent and returns affected count.
- Expiration by cutoff updates only eligible active contexts.
- No full WhatsApp transcript is persisted or exposed as context.
- No live WhatsApp conversation behavior changes in this phase.
- Architecture docs mention the new services/use-cases.
