# Feature Specification: Agent Reservation Limit Visibility

**Feature Branch**: `feat/limit-endpoint`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Tenemos que crear una feature para exponerle al frontend cuanto cupo de reservas atraves del agente quedan, segun el plan del cliente. La idea es crear un endpoint que exponga esta info para ser consumida por el front. El nombre de la branch tiene que ser feat/limit-endpoint"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Show Remaining Agent Reservation Quota (Priority: P1)

As a frontend user viewing a customer's account or dashboard, I want to see how many reservations through the agent remain for the current billing period, so that I can understand whether the customer is close to reaching the plan limit.

**Why this priority**: The core business value is making the plan limit visible before the user discovers the limit only when the agent stops accepting new reservations.

**Independent Test**: Can be tested by requesting the customer's current quota summary and verifying that the response contains the plan limit, consumed reservations, and remaining reservations for the active billing period.

**Acceptance Scenarios**:

1. **Given** a customer with an active plan and unused agent reservation quota, **When** the frontend asks for the quota summary, **Then** the user sees the total plan limit, the consumed amount, and the remaining amount for the current period.
2. **Given** a customer whose consumed reservations equal the plan limit, **When** the frontend asks for the quota summary, **Then** the user sees that no agent reservation quota remains.
3. **Given** a customer whose consumed reservations exceed the expected plan limit because of historical or corrected usage data, **When** the frontend asks for the quota summary, **Then** the remaining amount is shown as zero and the over-limit state is identifiable.

---

### User Story 2 - Represent Quota State Clearly in the Frontend (Priority: P2)

As a frontend user, I want the quota summary to indicate whether usage is available, close to the limit, exhausted, or unavailable, so that the interface can present a clear state without duplicating business rules.

**Why this priority**: The frontend should not infer plan states from raw numbers alone when the backend already owns billing and usage rules.

**Independent Test**: Can be tested by validating quota summaries for available, near-limit, exhausted, and unavailable cases and confirming that each case includes a clear state.

**Acceptance Scenarios**:

1. **Given** a customer with comfortable quota remaining, **When** the frontend asks for the quota summary, **Then** the response identifies the quota as available.
2. **Given** a customer close to exhausting the quota, **When** the frontend asks for the quota summary, **Then** the response identifies the quota as near its limit.
3. **Given** a customer without a usable active plan or with usage data that cannot be resolved, **When** the frontend asks for the quota summary, **Then** the response identifies that the quota is unavailable instead of returning misleading numbers.

---

### User Story 3 - Keep Displayed Quota Consistent With Agent Enforcement (Priority: P3)

As an operator, I want the quota shown in the frontend to match the same monthly usage rules enforced by the agent, so that customers and support teams see consistent information across channels.

**Why this priority**: Consistency prevents support issues where the dashboard claims capacity remains while the agent rejects or blocks reservation creation.

**Independent Test**: Can be tested by comparing the quota summary against the same customer and billing period used by the agent limit validation.

**Acceptance Scenarios**:

1. **Given** the agent would allow a new reservation because quota remains, **When** the frontend asks for the quota summary, **Then** the summary indicates remaining quota greater than zero.
2. **Given** the agent would block new reservations because quota is exhausted, **When** the frontend asks for the quota summary, **Then** the summary indicates zero remaining quota and an exhausted state.

### Edge Cases

- A customer has no active plan or subscription for the current period.
- The plan allows unlimited or non-metered agent reservations.
- Usage records are missing, delayed, or temporarily unavailable.
- Consumption is higher than the plan limit due to corrections, race conditions, or historical data.
- The billing period boundary changes and the visible quota must reflect the new active period.
- The frontend requests quota for an unknown or inaccessible customer.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a customer-specific quota summary for reservations managed through the agent.
- **FR-002**: The quota summary MUST include the active plan reservation limit, consumed reservations in the current billing period, remaining reservations, billing period start, and billing period end.
- **FR-003**: The quota summary MUST identify the quota state as available, near limit, exhausted, unlimited, or unavailable.
- **FR-004**: The remaining reservation count MUST never be negative; over-limit usage MUST be represented through an explicit state or overage indicator.
- **FR-005**: The quota summary MUST use the same customer plan and monthly usage rules used to enforce agent reservation limits.
- **FR-006**: The system MUST avoid exposing quota information for customers the requester is not allowed to access.
- **FR-007**: The system MUST return a clear unavailable state when plan or usage information cannot be resolved reliably.
- **FR-008**: The quota summary MUST be suitable for direct frontend display without requiring the frontend to reimplement billing calculations.
- **FR-009**: The feature MUST NOT change how reservations are counted, consumed, released, or enforced by the agent.
- **FR-010**: The feature MUST include validation coverage for normal quota, near-limit quota, exhausted quota, unlimited quota, unavailable data, and unauthorized customer access.

### Key Entities

- **Customer**: The account or tenant whose agent reservation quota is being requested.
- **Plan**: The commercial subscription level that defines the reservation quota available through the agent.
- **Billing Period**: The active time window in which reservation usage is counted against the plan.
- **Agent Reservation Usage**: The number of reservations created through the agent during the active billing period.
- **Quota Summary**: The frontend-facing view of limit, consumed amount, remaining amount, period, and quota state.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Frontend consumers can obtain a complete quota summary for an eligible customer in one request.
- **SC-002**: 100% of tested quota states return unambiguous display data without requiring frontend-side billing calculations.
- **SC-003**: Displayed remaining quota matches agent limit enforcement for the same customer and billing period in all covered validation scenarios.
- **SC-004**: Unauthorized or unknown customer requests do not expose quota numbers.
- **SC-005**: Support or operations users can determine whether a customer has remaining agent reservation quota in under 10 seconds from the frontend view.

## Assumptions

- The quota is monthly and tied to the same billing period currently used for agent reservation limit enforcement.
- The target consumer is an authenticated frontend for customer/account administration.
- The feature exposes visibility only; it does not add new billing rules or mutate usage.
- Near-limit status can be derived from a stable product threshold during planning or implementation.
- Unlimited plans, if supported by existing billing data, should be represented explicitly instead of using a misleading numeric limit.
