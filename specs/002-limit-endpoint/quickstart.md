# Quickstart: Agent Reservation Limit Visibility

## Goal

Implement a secure read-only endpoint in `BillingUsageModule` that allows the frontend to fetch remaining agent reservation quota for a customer account.

## Expected Route

```http
GET /bot/billing-usage/accounts/{accountId}/whatsapp-reservation-quota
```

Required header:

```http
x-internal-api-token: <INTERNAL_API_TOKEN>
```

## Implementation Outline

1. Move `InternalApiTokenGuard` from `src/modules/reservations/guards` to `src/common/guards`.
2. Update reservations imports/tests so existing dashboard endpoints still use the same guard.
3. Add billing quota summary types under `src/lib/types/billing-usage`.
4. Add `GetWhatsappReservationQuotaSummaryUseCase` in `src/modules/billing-usage/application`.
5. Add response/path DTOs under `src/modules/billing-usage/dto`.
6. Add `BillingUsageController` under `src/modules/billing-usage/controller`.
7. Register the controller, use-case, and shared guard provider in `BillingUsageModule`.
8. Add focused tests for the use-case, controller, guard reuse, and repository behavior if repository changes are needed.
9. Update architecture/security docs if the implemented route changes documented internal endpoint ownership.

## Manual Verification

With a valid token:

```bash
curl -H "x-internal-api-token: $INTERNAL_API_TOKEN" \
  "http://localhost:3000/bot/billing-usage/accounts/acct_123/whatsapp-reservation-quota"
```

Expected:

- `200 OK`
- Response includes `accountId`, `period`, `plan`, `used`, `remaining`, `overage`, and `state`.
- `remaining` is never negative.

With an invalid token:

```bash
curl -H "x-internal-api-token: invalid" \
  "http://localhost:3000/bot/billing-usage/accounts/acct_123/whatsapp-reservation-quota"
```

Expected:

- `403 Forbidden`
- No quota numbers exposed.

## Required Validation Before Completion

Run:

```bash
npm run fix
npm test -- src/modules/billing-usage src/common/guards src/modules/reservations
```

If the test command path filter does not match the final test layout, run the closest focused Jest command plus the affected existing reservations guard/controller tests.
