# Data Model: Reservation Context Services

This phase does not introduce new database entities. It defines application-level data contracts on top of the Phase 1 `Reservation Context` storage model.

## Entity: Reservation Context Request

Represents an internal request to save the latest actionable reservation for one WhatsApp user.

### Fields

| Field                     | Type     | Required | Notes                                                                        |
| ------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `waId`                    | string   | yes      | WhatsApp user identifier; normalized before persistence                      |
| `phone`                   | string   | yes      | Operational phone used to locate reservations; normalized before persistence |
| `reservationDate`         | string   | yes      | Business-facing date value                                                   |
| `reservationTime`         | string   | yes      | Business-facing time value                                                   |
| `reservationStartsAt`     | datetime | yes      | Absolute reservation start moment                                            |
| `reservationEndsAt`       | datetime | yes      | Absolute reservation end moment                                              |
| `name`                    | string   | yes      | Customer name                                                                |
| `quantity`                | integer  | yes      | Party size                                                                   |
| `lastConversationSummary` | string   | no       | Optional short summary; must not be a full transcript                        |

### Validation Rules

- `waId`, `phone`, `reservationDate`, `reservationTime`, and `name` must not be blank after trimming.
- `quantity` must be a positive integer.
- `reservationEndsAt` must be later than `reservationStartsAt`.
- `lastConversationSummary`, when present, is auxiliary and must not be treated as authoritative reservation data.
- The request must not contain or persist the full WhatsApp conversation.

## Entity: Reservation Context Result

Represents the normalized active context returned to future internal reservation flows.

### Fields

| Field                     | Type        | Required | Notes                               |
| ------------------------- | ----------- | -------- | ----------------------------------- |
| `id`                      | string      | yes      | Stored context identifier           |
| `waId`                    | string      | yes      | Normalized WhatsApp user identifier |
| `phone`                   | string      | yes      | Normalized operational phone        |
| `reservationDate`         | string      | yes      | Business-facing date                |
| `reservationTime`         | string      | yes      | Business-facing time                |
| `reservationStartsAt`     | datetime    | yes      | Absolute start moment               |
| `reservationEndsAt`       | datetime    | yes      | Absolute end moment                 |
| `name`                    | string      | yes      | Customer name                       |
| `quantity`                | integer     | yes      | Party size                          |
| `lastConversationSummary` | string/null | no       | Optional short summary              |
| `createdAt`               | datetime    | yes      | Storage creation moment             |
| `updatedAt`               | datetime    | yes      | Storage update moment               |

### Validation Rules

- Returned context must come only from active, not-yet-ended storage rows.
- Returned context must map storage details into a stable application result without exposing persistence-only concerns beyond the required identifier and timestamps.

## Entity: Context Absence

Represents the expected result when no actionable context exists.

### Fields

| Field    | Type    | Required | Notes                                                                                                                     |
| -------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `found`  | boolean | yes      | `false` when no actionable context is available                                                                           |
| `reason` | enum    | yes      | Expected values: `not_found`, `cancelled`, `expired`, `already_ended`, or generic absence when storage cannot distinguish |

### Validation Rules

- Absence must not include inferred reservation data.
- Absence is not a failure by itself; callers decide whether to ask the user for missing details.

## Entity: Reservation Context Operation Result

Represents the outcome of save, cancel, or expire operations.

### Fields

| Field       | Type                       | Required | Notes                                                      |
| ----------- | -------------------------- | -------- | ---------------------------------------------------------- |
| `success`   | boolean                    | yes      | Whether the requested operation completed                  |
| `context`   | Reservation Context Result | no       | Present when a save returns an active context              |
| `affected`  | integer                    | no       | Number of contexts invalidated by cancel/expire operations |
| `errorCode` | enum                       | no       | Stable error code for validation or persistence failure    |
| `message`   | string                     | no       | Human-readable diagnostic for logs/callers                 |

### Validation Rules

- Validation failures must not call persistence.
- Persistence failures must be reported without fabricating a saved context.
- Cancel operations for missing context should complete with `affected = 0`, not create data.

## State Transitions

```text
valid save request -> active context
active context + valid save request for same waId -> active context replaced
active context + cancel request -> cancelled context
active context + expiration cutoff after reservation end -> expired context
missing context + cancel request -> no-op result
invalid save request -> validation failure, no active context
```

## Relationships

- `Reservation Context Request` is persisted through the Phase 1 `Reservation Context` repository.
- `Reservation Context Result` is derived from the Phase 1 stored context entity.
- No new database relationship is introduced in this phase.
