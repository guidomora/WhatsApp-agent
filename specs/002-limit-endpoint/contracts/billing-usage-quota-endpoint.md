# Contract: Billing Usage Reservation Quota Endpoint

## Endpoint

```http
GET /bot/billing-usage/accounts/{accountId}/whatsapp-reservation-quota
```

Returns the current billing-period quota summary for reservations created through the agent.

## Authentication

Required header:

```http
x-internal-api-token: <INTERNAL_API_TOKEN>
```

Requests without a valid internal API token must be rejected and must not expose quota data.

## Path Parameters

| Name        | Type   | Required | Description                                        |
| ----------- | ------ | -------- | -------------------------------------------------- |
| `accountId` | string | yes      | Customer account whose quota summary is requested. |

## Success Response

Status: `200 OK`

```json
{
  "accountId": "acct_123",
  "period": "2026-06",
  "periodStart": "2026-06-01T00:00:00.000Z",
  "periodEnd": "2026-07-01T00:00:00.000Z",
  "plan": {
    "id": "plan_123",
    "code": "basic",
    "name": "Basic",
    "monthlyWhatsappReservationLimit": 100
  },
  "used": 82,
  "remaining": 18,
  "overage": 0,
  "state": "near_limit"
}
```

## Exhausted Response

Status: `200 OK`

```json
{
  "accountId": "acct_123",
  "period": "2026-06",
  "periodStart": "2026-06-01T00:00:00.000Z",
  "periodEnd": "2026-07-01T00:00:00.000Z",
  "plan": {
    "id": "plan_123",
    "code": "basic",
    "name": "Basic",
    "monthlyWhatsappReservationLimit": 100
  },
  "used": 100,
  "remaining": 0,
  "overage": 0,
  "state": "exhausted"
}
```

## Over-Limit Response

Status: `200 OK`

```json
{
  "accountId": "acct_123",
  "period": "2026-06",
  "periodStart": "2026-06-01T00:00:00.000Z",
  "periodEnd": "2026-07-01T00:00:00.000Z",
  "plan": {
    "id": "plan_123",
    "code": "basic",
    "name": "Basic",
    "monthlyWhatsappReservationLimit": 100
  },
  "used": 103,
  "remaining": 0,
  "overage": 3,
  "state": "exhausted"
}
```

## Unavailable Response

Status: `200 OK`

```json
{
  "accountId": "acct_123",
  "period": "2026-06",
  "periodStart": null,
  "periodEnd": null,
  "plan": null,
  "used": 0,
  "remaining": 0,
  "overage": 0,
  "state": "unavailable",
  "unavailableReason": "missing_active_subscription"
}
```

## Error Responses

### Invalid or Missing Internal Token

Status: `403 Forbidden`

```json
{
  "statusCode": 403,
  "message": "Invalid internal API token",
  "error": "Forbidden"
}
```

### Invalid Account Parameter

Status: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": ["accountId should not be empty"],
  "error": "Bad Request"
}
```

## Quota States

| State         | Meaning                                                               |
| ------------- | --------------------------------------------------------------------- |
| `available`   | Finite plan has quota remaining above the near-limit threshold.       |
| `near_limit`  | Finite plan has quota remaining at or below the near-limit threshold. |
| `exhausted`   | Finite plan has no quota remaining.                                   |
| `unlimited`   | Plan data explicitly represents unlimited agent reservations.         |
| `unavailable` | Quota cannot be resolved or should not be displayed.                  |

## Non-Goals

- The endpoint does not consume, release, or reserve quota.
- The endpoint does not modify subscriptions, plans, or usage rows.
- The endpoint does not replace the existing agent-side limit enforcement.
