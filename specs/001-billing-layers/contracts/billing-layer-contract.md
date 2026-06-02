# Contract: Billing Layer Responsibilities

This feature does not add or change external HTTP endpoints. The contract below documents internal module boundaries that implementation must preserve.

## Public Module Contract

`BillingUsageModule` must continue exporting a service that supports the existing billing quota methods:

- `canCreateWhatsappReservation(accountId)`
- `consumeWhatsappReservationQuota(params)`
- `releaseWhatsappReservationQuota(params)`

Expected behavior:

- Existing callers do not need to change imports or method names.
- Existing result shapes remain unchanged.
- Existing failure reasons remain unchanged.
- Duplicate quota consumption remains idempotent.
- Quota consumption remains atomic under the monthly plan limit.
- Quota release remains idempotent and never decrements below zero.

## Repository Responsibility Contract

The billing repository owns persistence concerns:

- Active subscription lookup with plan data.
- Monthly usage lookup by account and period.
- Usage event insert/delete operations.
- Monthly usage initialization.
- Atomic monthly usage increment/decrement.
- Transaction execution for consume and release flows.
- Database result interpretation.

The billing repository must not return user-facing messages or service-level result types unless those types represent persistence outcomes only.

## Use-Case Responsibility Contract

Billing use-cases own workflow orchestration:

- Check quota eligibility.
- Consume quota for a WhatsApp reservation.
- Release quota for a WhatsApp reservation.

Use-cases must not construct raw database queries or depend on database-specific result shapes.

## Service Facade Contract

`UsageLimitService` remains a thin facade:

- It delegates to use-cases.
- It preserves the existing public methods and return types.
- It does not own direct database communication after the refactor.

## Non-Goals

- No new customer-facing billing behavior.
- No new persisted tables or columns.
- No new runtime dependencies.
- No refactor outside billing unless required to preserve existing callers or update documentation.
