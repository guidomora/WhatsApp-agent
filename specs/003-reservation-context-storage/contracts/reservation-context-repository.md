# Contract: Reservation Context Repository

This is an internal module contract for Phase 1 storage. It does not expose an HTTP endpoint and does not change user-facing conversation behavior.

## `upsertActiveContext(input)`

Creates or replaces the reservation context for a WhatsApp user.

### Input

| Field                     | Required | Description                       |
| ------------------------- | -------- | --------------------------------- |
| `waId`                    | yes      | WhatsApp user identifier          |
| `phone`                   | yes      | Normalized operational phone      |
| `reservationDate`         | yes      | Business-facing reservation date  |
| `reservationTime`         | yes      | Business-facing reservation time  |
| `reservationStartsAt`     | yes      | Absolute reservation start moment |
| `reservationEndsAt`       | yes      | Absolute reservation end moment   |
| `name`                    | yes      | Customer name                     |
| `quantity`                | yes      | Party size                        |
| `lastConversationSummary` | no       | Optional short summary            |

### Behavior

- Creates a new context when no row exists for `waId`.
- Replaces the existing context when a row already exists for `waId`.
- Sets `status` to `active`.
- Updates `updatedAt`.
- Preserves the invariant of one context per `waId`.

### Output

Returns the saved `ReservationContext`.

## `findActiveByWaId(waId, now)`

Finds the usable context for a WhatsApp user.

### Input

| Field  | Required | Description                      |
| ------ | -------- | -------------------------------- |
| `waId` | yes      | WhatsApp user identifier         |
| `now`  | yes      | Comparison moment for expiration |

### Behavior

- Returns a context only when `status = active`.
- Returns a context only when `reservationEndsAt > now`.
- Returns `null` when no usable context exists.

### Output

`ReservationContext | null`

## `markCancelledByWaId(waId)`

Marks a user's context as cancelled.

### Input

| Field  | Required | Description              |
| ------ | -------- | ------------------------ |
| `waId` | yes      | WhatsApp user identifier |

### Behavior

- Sets `status = cancelled` for the matching row.
- Updates `updatedAt`.
- Does nothing when no matching row exists.

### Output

Returns the number of affected rows.

## `markExpiredBefore(cutoffDate)`

Marks active contexts as expired when their reservation already ended before a cutoff.

### Input

| Field        | Required | Description       |
| ------------ | -------- | ----------------- |
| `cutoffDate` | yes      | Expiration cutoff |

### Behavior

- Updates only rows where `status = active`.
- Updates only rows where `reservationEndsAt < cutoffDate`.
- Sets `status = expired`.
- Updates `updatedAt`.

### Output

Returns the number of affected rows.
