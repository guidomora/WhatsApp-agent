# Quickstart: Reservation Context Storage

## Scope

This phase adds storage only. It must not connect the new context module to the live WhatsApp create/update/cancel flows.

## Expected Implementation

1. Add shared reservation-context types under `src/lib/types/reservation-context/`.
2. Add a dedicated `ReservationContextModule`.
3. Add a TypeORM entity for `reservation_contexts`.
4. Add a migration that creates:
   - table `reservation_contexts`
   - unique index on `waId`
   - index on `status` and `reservationEndsAt`
5. Add `ReservationContextRepository` with:
   - `upsertActiveContext`
   - `findActiveByWaId`
   - `markCancelledByWaId`
   - `markExpiredBefore`
6. Add focused repository tests.
7. Update architecture docs after implementation to mention the new PostgreSQL operational context table.

## Verification Commands

Run formatting and linting:

```bash
npm run fix
```

Run focused tests:

```bash
npm run test:reservation-context
```

Run the full suite when the focused tests pass:

```bash
npm test
```

Apply migrations only in a local or approved development database:

```bash
npm run migration:run
```

## Acceptance Checks

- A complete context can be saved for a `waId`.
- Saving another context for the same `waId` replaces the previous one.
- Active lookup excludes cancelled contexts.
- Active lookup excludes expired or already-ended contexts.
- `markExpiredBefore` only changes active rows that ended before the cutoff.
- No full conversation transcript is stored.
- No user-facing conversational behavior changes are introduced.
