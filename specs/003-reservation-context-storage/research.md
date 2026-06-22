# Research: Reservation Context Storage

## Decision: Use a dedicated `reservation-context` module

**Rationale**: The feature stores durable operational context for future reservation assistance. It is separate from `billing-usage`, which owns plan/subscription/quota data, and separate from `cache-context`, which owns short-lived conversation state.

**Alternatives considered**:

- Add to `ReservationsModule`: fewer files, but mixes orchestration strategies with persistence infrastructure.
- Add to `CacheContextModule`: misleading boundary because this state survives cache expiration.
- Add to `BillingUsageModule`: incorrect ownership because this data is not billing or quota related.

## Decision: Use table `reservation_contexts` with one row per `waId`

**Rationale**: The product rule is one actionable WhatsApp conversation per number. A unique `waId` constraint enforces that rule and makes upsert semantics straightforward.

**Alternatives considered**:

- `last_reservation_contexts`: explicit but too narrow if the module later supports related context behavior.
- `whatsapp_reservation_contexts`: precise but unnecessarily channel-specific in the table name because `waId` already captures the source.
- Multiple rows per user: more flexible, but outside Phase 1 and would require ambiguity rules.

## Decision: Store both `waId` and `phone`

**Rationale**: `waId` identifies the WhatsApp conversation/user, while `phone` is the normalized operational value used to locate reservations. Keeping both avoids implicit conversion rules in storage consumers.

**Alternatives considered**:

- Store only `waId`: would force downstream code to derive the operational phone and risk inconsistent normalization.
- Store only `phone`: would lose the direct conversation identity used by WhatsApp/cache flows.

## Decision: Store business strings and timestamp boundaries

**Rationale**: `reservationDate` and `reservationTime` preserve the existing reservation-facing values used by Sheets and conversational flows. `reservationStartsAt` and `reservationEndsAt` support reliable active/expired decisions and indexed cleanup preparation.

**Alternatives considered**:

- Strings only: easy to hydrate update/cancel, but unreliable for expiration queries.
- Timestamps only: good for queries, but loses the original business-facing labels required by existing flows.

## Decision: Use `active`, `cancelled`, `expired` status values

**Rationale**: These states cover the Phase 1 lifecycle: usable context, manually deactivated context, and time-expired context. They also prepare the model for future cleanup without deleting records in this phase.

**Alternatives considered**:

- Boolean `isActive`: cannot distinguish cancellation from expiration.
- Delete-on-cancel: simpler, but loses the ability to test deactivation semantics and future audit decisions.

## Decision: Include nullable `lastConversationSummary`

**Rationale**: The feature explicitly does not store full conversation transcripts, but an optional short summary may help future phases. Adding the nullable field now avoids a follow-up schema change while keeping writes optional.

**Alternatives considered**:

- Exclude summary: most minimal, but likely to require another migration soon.
- Store full transcript: rejected for scope, privacy, and prompt quality reasons.

## Decision: Do not include `accountId` in Phase 1

**Rationale**: The current operational reservation flow is not modeled as multi-account. Adding `accountId` now would couple this context table to billing/platform concepts before the reservation domain needs it.

**Alternatives considered**:

- Unique `(accountId, waId)`: better for future multi-tenant support, but adds complexity and cross-module dependency that is not required for the current MVP.

## Decision: Repository contract exposes four methods

**Rationale**: `upsertActiveContext`, `findActiveByWaId`, `markCancelledByWaId`, and `markExpiredBefore` cover all Phase 1 requirements without introducing cleanup deletion or flow integration.

**Alternatives considered**:

- Add `deleteExpiredBefore`: useful for cleanup, but cleanup is explicitly later.
- Add conversational service/use-cases now: premature because this phase is storage-only.
