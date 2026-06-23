# Contract: Reservation Context Application Layer

This is an internal module contract. It does not expose HTTP endpoints and must not change live WhatsApp conversation behavior in this phase.

## `SaveReservationContextUseCase.execute(input)`

Saves the latest actionable reservation context for a WhatsApp user.

### Input

| Field                     | Required | Description                                     |
| ------------------------- | -------- | ----------------------------------------------- |
| `waId`                    | yes      | WhatsApp user identifier                        |
| `phone`                   | yes      | Operational phone used to locate reservations   |
| `reservationDate`         | yes      | Business-facing reservation date                |
| `reservationTime`         | yes      | Business-facing reservation time                |
| `reservationStartsAt`     | yes      | Absolute reservation start moment               |
| `reservationEndsAt`       | yes      | Absolute reservation end moment                 |
| `name`                    | yes      | Customer name                                   |
| `quantity`                | yes      | Party size                                      |
| `lastConversationSummary` | no       | Optional short summary, never a full transcript |

### Behavior

- Normalizes text identifiers before persistence.
- Validates required fields, quantity, and time window.
- Does not call persistence when validation fails.
- Saves valid context as the latest active context for the user.
- Replaces the previous context for the same user.
- Reports persistence failures to the caller.

### Output

`ReservationContextOperationResult` with either the saved context or a stable error code.

## `GetActiveReservationContextUseCase.execute(waId, now)`

Retrieves actionable context for a WhatsApp user.

### Input

| Field  | Required | Description                               |
| ------ | -------- | ----------------------------------------- |
| `waId` | yes      | WhatsApp user identifier                  |
| `now`  | yes      | Comparison moment for active/ended checks |

### Behavior

- Normalizes the WhatsApp identifier before lookup.
- Returns context only when storage reports an active, not-yet-ended context.
- Returns explicit absence when no usable context exists.
- Does not infer missing reservation data from conversation history.

### Output

`GetActiveReservationContextResult`, either found context or explicit absence.

## `CancelReservationContextUseCase.execute(waId)`

Marks one user's context as cancelled.

### Input

| Field  | Required | Description              |
| ------ | -------- | ------------------------ |
| `waId` | yes      | WhatsApp user identifier |

### Behavior

- Normalizes the WhatsApp identifier.
- Delegates cancellation to Phase 1 repository behavior.
- Treats missing context as a successful no-op with `affected = 0`.

### Output

`ReservationContextOperationResult` with affected row count or persistence error.

## `ExpireReservationContextsUseCase.execute(cutoffDate)`

Marks active contexts as expired when their reservation ended before a cutoff.

### Input

| Field        | Required | Description       |
| ------------ | -------- | ----------------- |
| `cutoffDate` | yes      | Expiration cutoff |

### Behavior

- Validates that cutoff is a valid date.
- Delegates expiration to Phase 1 repository behavior.
- Changes only active contexts that ended before the cutoff.

### Output

`ReservationContextOperationResult` with affected row count or validation/persistence error.

## `ReservationContextValidationService`

Validates save inputs and operation inputs.

### Behavior

- Rejects blank required text fields.
- Rejects non-positive or non-integer quantity.
- Rejects invalid time windows.
- Returns stable validation error codes.

## `ReservationContextNormalizerService`

Normalizes user-facing identifiers before validation and persistence.

### Behavior

- Trims required text fields.
- Normalizes `waId` and `phone` consistently.
- Leaves business-facing date and time text readable.
