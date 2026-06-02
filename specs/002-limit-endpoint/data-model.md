# Data Model: Agent Reservation Limit Visibility

## Account

Represents the customer account whose quota is requested.

**Fields used**

- `id`: account identifier supplied by the frontend.

**Relationships**

- Has subscriptions.
- Has monthly usage rows.

**Validation rules**

- `accountId` must be present in the endpoint path.
- Unknown or inaccessible accounts must not expose quota data.

## Plan

Represents the customer's commercial plan.

**Fields used**

- `id`: plan identifier.
- `code`: stable plan code.
- `name`: display-friendly plan name.
- `monthlyWhatsappReservationLimit`: finite monthly reservation quota currently enforced by the agent.
- `isActive`: whether the plan can be used.

**Validation rules**

- Inactive plans produce an unavailable quota state.
- Finite limits must be non-negative for display calculations.

## Subscription

Represents the active plan assignment for an account and billing period.

**Fields used**

- `accountId`: customer account.
- `planId`: related plan.
- `status`: active, paused, or cancelled.
- `currentPeriodStart`: start of active billing period.
- `currentPeriodEnd`: end of active billing period.

**Relationships**

- Belongs to an account.
- Belongs to a plan.

**Validation rules**

- Only active subscriptions whose period contains the request time are eligible.
- Missing active subscription produces an unavailable quota state.

## MonthlyUsage

Represents usage accumulated for an account in a billing period.

**Fields used**

- `accountId`: customer account.
- `period`: current monthly period key.
- `whatsappReservationsUsed`: reservations consumed by the agent in the period.

**Relationships**

- Belongs to an account.

**Validation rules**

- Missing usage for the current period is treated as zero consumed reservations.
- Consumed value above the plan limit is allowed for display but remaining quota must be zero.

## QuotaSummary

Frontend-facing read model returned by the endpoint.

**Fields**

- `accountId`: requested account.
- `period`: current billing period key.
- `periodStart`: active billing period start timestamp.
- `periodEnd`: active billing period end timestamp.
- `plan`: object with `id`, `code`, `name`, and `monthlyWhatsappReservationLimit`.
- `used`: reservations consumed during the current period.
- `remaining`: reservations still available; never negative.
- `overage`: amount consumed above the finite limit; zero when not over limit.
- `state`: `available`, `near_limit`, `exhausted`, `unlimited`, or `unavailable`.
- `unavailableReason`: present only when state is `unavailable`.

**State rules**

- `unavailable`: no active subscription, inactive plan, invalid limit data, unauthorized access, or unresolved usage data.
- `unlimited`: plan data explicitly represents unlimited quota.
- `exhausted`: finite limit exists and `used >= limit`.
- `near_limit`: finite limit exists, quota remains, and remaining quota is at or below the backend near-limit threshold.
- `available`: finite limit exists and remaining quota is above the backend near-limit threshold.

**Transition rules**

- Creating a WhatsApp/agent reservation can move `available` to `near_limit` or `exhausted`.
- Releasing a reservation quota can move `exhausted` to `near_limit` or `available`.
- Billing period rollover resets the summary to the new active period.
