# Data Model: Billing Responsibility Separation

This feature does not introduce new persisted data. It reorganizes how existing billing data is accessed and how billing workflows are orchestrated.

## Existing Persisted Entities

### Account

Represents a customer/account that can have billing plans, subscriptions, usage events, and monthly usage.

Relevant relationship:

- Has subscriptions.
- Has usage events.
- Has monthly usage rows.

Validation rules:

- Existing account identifiers remain unchanged.

### Plan

Represents a billable plan and the WhatsApp reservation quota available for a billing period.

Relevant fields:

- Active flag.
- Monthly WhatsApp reservation limit.

Validation rules:

- Inactive plans must block usage.
- Monthly WhatsApp reservation limit must continue to be enforced by the quota consume flow.

### Subscription

Represents the active plan assignment for an account during a period.

Relevant fields:

- Account identifier.
- Status.
- Current period start.
- Current period end.
- Related plan.

Validation rules:

- A subscription is usable only when status is active and the current timestamp is within its period.
- The most recent active subscription for the current timestamp should be used when more than one candidate exists.

### UsageEvent

Represents an individual quota-consuming event.

Relevant fields:

- Account identifier.
- Idempotency key.
- Event type.
- Period.
- Quantity.
- Metadata.
- Occurrence timestamp.

Validation rules:

- Duplicate idempotency keys for the same quota event must not double-count usage.
- WhatsApp reservation creation events must keep using the existing event type.

### MonthlyUsage

Represents aggregated usage for an account and billing period.

Relevant fields:

- Account identifier.
- Period.
- WhatsApp reservations used.
- Updated timestamp.

Validation rules:

- Usage increments must remain bounded by the plan monthly limit.
- Usage decrements must not reduce the counter below zero.

## New Responsibility Models

### BillingUsageRepository

Owns database communication for billing quota flows.

Responsibilities:

- Find active subscriptions with plan data.
- Find current monthly usage for an account and period.
- Execute quota consumption in one transaction.
- Execute quota release in one transaction.
- Hide database-specific result parsing from services and use-cases.

Does not own:

- Deciding which business response should be returned to callers.
- Formatting public service results.

### Billing Use-Cases

Own business-flow orchestration for quota operations when the service would otherwise be overloaded.

Responsibilities:

- Calculate the current billing period through the existing period service.
- Ask the repository for the data or atomic operation needed by the flow.
- Map repository outcomes to public billing result types.
- Preserve existing reasons: `missing_active_subscription`, `inactive_plan`, and `limit_reached`.

Does not own:

- Raw database query composition.
- Nest module exports.

### UsageLimitService Facade

Owns the stable module-facing API for current consumers.

Responsibilities:

- Preserve method names and return types.
- Delegate to billing use-cases.
- Remain exported by `BillingUsageModule`.

Does not own:

- Database query details.
- Multi-step billing workflow logic that belongs in a use-case.
