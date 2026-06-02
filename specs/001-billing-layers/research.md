# Research: Billing Responsibility Separation

## Decision: Keep `UsageLimitService` as the exported facade

**Rationale**: Current callers depend on the billing module through `UsageLimitService`. Keeping the service as the facade preserves module contracts while allowing the internal responsibilities to move into repositories and use-cases.

**Alternatives considered**:

- Replace service callers with use-cases directly: rejected because it expands the refactor outside the billing module and increases regression risk.
- Leave service as-is and only split helper methods: rejected because database access, transactions, idempotency, and billing decisions would remain concentrated in the same class.

## Decision: Add a billing repository for database communication

**Rationale**: `UsageLimitService` currently injects `DataSource` and TypeORM repositories directly, builds queries, executes transactions, and parses raw insert/update/delete results. A repository boundary gives one owner to database-specific behavior and makes business flow tests easier to read.

**Alternatives considered**:

- Keep TypeORM calls in use-cases: rejected because use-cases would inherit database details and remain hard to test at the business-flow level.
- Create one repository per entity: rejected for this feature because the flows need coordinated operations across subscriptions, usage events, and monthly usage; splitting too finely would add indirection without clearer behavior.

## Decision: Add use-cases only for quota workflows with orchestration

**Rationale**: The quota check, consume, and release operations represent business flows. The consume path is especially complex because it must validate subscription state, insert an idempotent event, initialize monthly usage, increment atomically under a plan limit, and map limit failures to business results.

**Alternatives considered**:

- Add use-cases for every billing service method automatically: rejected because the user requested use-cases only when a service concentrated too much logic.
- Keep all business flow logic in `UsageLimitService`: rejected because it leaves the service overloaded even after repository extraction.

## Decision: Keep `BillingPeriodService` as a service

**Rationale**: `BillingPeriodService` is small, cohesive, deterministic, and already tested. It does not currently justify a use-case or repository boundary.

**Alternatives considered**:

- Move period calculation into use-cases: rejected because it would duplicate a cohesive existing service responsibility.
- Move period calculation into repository: rejected because period calculation is domain logic, not database communication.

## Decision: Preserve current atomicity and idempotency semantics

**Rationale**: Billing quota consumption protects downstream WhatsApp reservation creation and must not double-count duplicate events or allow usage to exceed plan limits under concurrent requests.

**Alternatives considered**:

- Read usage, check in memory, then update: rejected because it weakens the current atomic database guard.
- Remove idempotent event insertion during refactor: rejected because it changes externally observable billing behavior.

## Decision: Use focused tests at repository, use-case, and service-facade levels

**Rationale**: Repository tests should verify database operation composition and raw result interpretation. Use-case tests should verify business results from repository outcomes. Service tests should verify delegation and preserved public contract without repeating all lower-level query assertions.

**Alternatives considered**:

- Keep all assertions in `UsageLimitService` tests: rejected because it would keep tests coupled to the old responsibility shape.
- Add only integration tests: rejected because the requested refactor needs fast feedback around responsibility boundaries and edge-case mapping.
