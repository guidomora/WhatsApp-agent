# Research: Agent Reservation Limit Visibility

## Decision: Place the endpoint in `BillingUsageModule`

**Rationale**: `BillingUsageModule` already owns account plan, subscription, monthly usage, quota validation, quota consumption, and quota release. Keeping the read endpoint there avoids spreading billing rules into reservation/dashboard modules.

**Alternatives considered**:

- Add the endpoint to `ReservationsController`: rejected because the endpoint exposes commercial plan/usage data, not reservation agenda data.
- Add a standalone dashboard module: rejected because it would duplicate or wrap billing rules without owning them.

## Decision: Expose `GET /bot/billing-usage/accounts/{accountId}/whatsapp-reservation-quota`

**Rationale**: The endpoint is account-specific, read-only, and scoped to WhatsApp/agent reservation quota, matching the existing naming in use-cases such as `CheckWhatsappReservationQuotaUseCase`.

**Alternatives considered**:

- `GET /bot/billing-usage/quota?accountId=...`: rejected because the resource is less explicit and easier to confuse with future quota types.
- `GET /bot/reservations/quota`: rejected because quota is a billing concern, not agenda availability.

## Decision: Use the internal API token guard

**Rationale**: Existing internal dashboard endpoints already use `x-internal-api-token` and `INTERNAL_API_TOKEN`. The new endpoint is for frontend/internal consumption and must not expose account usage publicly.

**Alternatives considered**:

- Public unauthenticated endpoint: rejected because it exposes customer plan and usage data.
- New token header: rejected because the project already has a suitable internal token convention.
- Twilio or agenda HMAC guards: rejected because this endpoint is neither a provider webhook nor an agenda maintenance endpoint.

## Decision: Move `InternalApiTokenGuard` to `src/common/guards`

**Rationale**: The existing guard lives under `reservations`, but `billing-usage` should not import security code from a module that already depends on billing. Moving the same guard behavior to `src/common/guards` keeps dependency direction clean, follows the user's requested common guard location, and preserves current reservations behavior.

**Alternatives considered**:

- Import `InternalApiTokenGuard` from `reservations` into `billing-usage`: rejected because it creates confusing cross-module coupling.
- Duplicate the guard in `billing-usage`: rejected because it splits a security rule that should stay consistent.

## Decision: Add a read-only use-case for quota summary

**Rationale**: Existing use-cases validate/consume/release quota. A dedicated `GetWhatsappReservationQuotaSummaryUseCase` can build the frontend-facing summary without mutating usage or changing enforcement behavior.

**Alternatives considered**:

- Reuse `CheckWhatsappReservationQuotaUseCase` directly: rejected because it only returns allowed/reason and does not expose limit, consumed amount, remaining amount, period bounds, or display state.
- Put summary logic in the controller: rejected because billing calculations and state mapping belong in the application layer.

## Decision: Represent quota state with a billing type enum/string union

**Rationale**: The frontend needs an unambiguous state: `available`, `near_limit`, `exhausted`, `unlimited`, or `unavailable`. Keeping this in `src/lib/types/billing-usage` follows repository conventions for interfaces, types, and enums.

**Alternatives considered**:

- Let the frontend infer state from numbers: rejected because that duplicates business rules and makes unavailable/unlimited states ambiguous.
- Return only `allowed`: rejected because it is insufficient for dashboard display.

## Decision: Treat unlimited quota as future-compatible but not assumed active

**Rationale**: The spec calls out unlimited plans as an edge case. Current `Plan.monthlyWhatsappReservationLimit` is a required integer, so implementation should support the display state only if existing data conventions can represent it safely; otherwise tests should document current finite-plan behavior.

**Alternatives considered**:

- Add database changes for nullable/unlimited plan limits now: rejected because the user asked for endpoint visibility, not new billing model behavior.
- Ignore unlimited plans: rejected because the frontend contract should not become misleading if billing data later supports unlimited plans.

## Decision: Near-limit threshold should be deterministic and backend-owned

**Rationale**: The frontend needs a display state without reimplementing billing logic. Use a stable backend threshold, such as remaining quota at or below 20% of the finite plan limit, unless implementation discovers an existing constant to reuse.

**Alternatives considered**:

- Frontend-defined threshold: rejected because it duplicates product logic.
- No near-limit state: rejected because the spec requires near-limit representation.
