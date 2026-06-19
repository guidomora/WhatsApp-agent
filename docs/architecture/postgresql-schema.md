# PostgreSQL Schema

Este documento describe el esquema PostgreSQL actual del proyecto. La fuente de verdad tecnica son las entidades TypeORM y las migraciones, especialmente:

- `src/modules/billing-usage/entities/*`
- `src/database/migrations/20260518000000-CreateBillingUsageTables.ts`

## Alcance

PostgreSQL guarda datos de plataforma para billing/usage:

- Cuenta/restaurante del sistema.
- Plan comercial aplicado.
- Suscripcion vigente o historica.
- Eventos de consumo de reservas creadas desde WhatsApp.
- Agregado mensual usado para validar limites.

No guarda reservas operativas, disponibilidad ni agenda.

## Relaciones

- `accounts` 1:N `subscriptions`
- `plans` 1:N `subscriptions`
- `accounts` 1:N `usage_events`
- `accounts` 1:N `monthly_usage`

Reglas de borrado definidas por la migracion:

- Si se borra una cuenta, se borran sus `subscriptions`, `usage_events` y `monthly_usage` (`CASCADE`).
- Un plan no se puede borrar si tiene suscripciones asociadas (`RESTRICT`).

## Tablas

### `accounts`

Representa una cuenta/restaurante. En el MVP existe una cuenta default.

| Columna     | Tipo           | Nullable | Default | Descripcion                                                     |
| ----------- | -------------- | -------- | ------- | --------------------------------------------------------------- |
| `id`        | `varchar`      | No       | -       | Identificador estable de la cuenta. En el MVP se usa `default`. |
| `name`      | `varchar(255)` | No       | -       | Nombre legible de la cuenta/restaurante.                        |
| `createdAt` | `timestamptz`  | No       | `now()` | Fecha de creacion del registro.                                 |
| `updatedAt` | `timestamptz`  | No       | `now()` | Fecha de ultima actualizacion del registro.                     |

Claves y relaciones:

- Primary key: `id`.
- Referenciada por `subscriptions.accountId`, `usage_events.accountId` y `monthly_usage.accountId`.

Codigo relacionado:

- `src/modules/billing-usage/entities/account.entity.ts`

### `plans`

Representa un plan comercial disponible para una cuenta.

| Columna                           | Tipo           | Nullable | Default             | Descripcion                                                          |
| --------------------------------- | -------------- | -------- | ------------------- | -------------------------------------------------------------------- |
| `id`                              | `uuid`         | No       | `gen_random_uuid()` | Identificador interno del plan.                                      |
| `code`                            | `varchar(100)` | No       | -                   | Codigo unico y estable del plan.                                     |
| `name`                            | `varchar(255)` | No       | -                   | Nombre legible del plan.                                             |
| `monthlyWhatsappReservationLimit` | `integer`      | No       | -                   | Cantidad maxima mensual de reservas WhatsApp permitidas por el plan. |
| `isActive`                        | `boolean`      | No       | `true`              | Indica si el plan esta habilitado para validar cupo.                 |
| `createdAt`                       | `timestamptz`  | No       | `now()`             | Fecha de creacion del registro.                                      |
| `updatedAt`                       | `timestamptz`  | No       | `now()`             | Fecha de ultima actualizacion del registro.                          |

Indices:

- `IDX_plans_code_unique`: unique sobre `code`.

Claves y relaciones:

- Primary key: `id`.
- Referenciada por `subscriptions.planId`.

Codigo relacionado:

- `src/modules/billing-usage/entities/plan.entity.ts`

### `subscriptions`

Relaciona una cuenta con un plan durante un periodo de vigencia.

| Columna              | Tipo          | Nullable | Default             | Descripcion                                                 |
| -------------------- | ------------- | -------- | ------------------- | ----------------------------------------------------------- |
| `id`                 | `uuid`        | No       | `gen_random_uuid()` | Identificador interno de la suscripcion.                    |
| `accountId`          | `varchar`     | No       | -                   | Cuenta a la que pertenece la suscripcion.                   |
| `planId`             | `uuid`        | No       | -                   | Plan asociado.                                              |
| `status`             | `enum`        | No       | -                   | Estado de la suscripcion: `active`, `paused` o `cancelled`. |
| `currentPeriodStart` | `timestamptz` | No       | -                   | Inicio de vigencia del periodo actual.                      |
| `currentPeriodEnd`   | `timestamptz` | No       | -                   | Fin exclusivo de vigencia del periodo actual.               |
| `createdAt`          | `timestamptz` | No       | `now()`             | Fecha de creacion del registro.                             |
| `updatedAt`          | `timestamptz` | No       | `now()`             | Fecha de ultima actualizacion del registro.                 |

Claves y relaciones:

- Primary key: `id`.
- Foreign key: `accountId` -> `accounts.id` con `CASCADE`.
- Foreign key: `planId` -> `plans.id` con `RESTRICT`.

Reglas de uso:

- Para validar cupo se busca una suscripcion con `status = active`, `currentPeriodStart <= now` y `currentPeriodEnd > now`.
- Si hay mas de una suscripcion activa que matchea, el repositorio ordena por `currentPeriodStart DESC`.

Codigo relacionado:

- `src/modules/billing-usage/entities/subscription.entity.ts`
- `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`

### `usage_events`

Ledger/auditoria de consumos. Permite reconstruir el consumo ante inconsistencias y evita doble consumo por reintentos.

| Columna          | Tipo           | Nullable | Default             | Descripcion                                                                       |
| ---------------- | -------------- | -------- | ------------------- | --------------------------------------------------------------------------------- |
| `id`             | `uuid`         | No       | `gen_random_uuid()` | Identificador interno del evento.                                                 |
| `accountId`      | `varchar`      | No       | -                   | Cuenta a la que se imputa el consumo.                                             |
| `eventType`      | `enum`         | No       | -                   | Tipo de evento. Actualmente: `whatsapp_reservation_created`.                      |
| `idempotencyKey` | `varchar(255)` | No       | -                   | Clave unica del evento de negocio. Para WhatsApp se deriva del mensaje procesado. |
| `quantity`       | `integer`      | No       | `1`                 | Cantidad consumida por el evento. Para reservas WhatsApp es `1`.                  |
| `period`         | `varchar(7)`   | No       | -                   | Periodo mensual calendario en formato `YYYY-MM`.                                  |
| `metadata`       | `jsonb`        | Si       | `null`              | Datos auxiliares para trazabilidad y reparacion manual.                           |
| `occurredAt`     | `timestamptz`  | No       | -                   | Momento en que ocurrio el evento de negocio.                                      |
| `createdAt`      | `timestamptz`  | No       | `now()`             | Fecha de creacion del registro.                                                   |

Indices:

- `IDX_usage_events_idempotency_key_unique`: unique sobre `idempotencyKey`.

Claves y relaciones:

- Primary key: `id`.
- Foreign key: `accountId` -> `accounts.id` con `CASCADE`.

Reglas de uso:

- `idempotencyKey` evita incrementar consumo dos veces por el mismo evento de negocio.
- La insercion usa `orIgnore()`: si la clave ya existe, el consumo se considera ya registrado y no vuelve a incrementar `monthly_usage`.
- Si una reserva falla despues de reservar cupo y corresponde compensar, se elimina el evento y se decrementa el agregado mensual.

Codigo relacionado:

- `src/modules/billing-usage/entities/usage-event.entity.ts`
- `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`

### `monthly_usage`

Agregado mensual por cuenta. Se usa para validar cupo sin recalcular todo el ledger en cada request.

| Columna                    | Tipo          | Nullable | Default             | Descripcion                                             |
| -------------------------- | ------------- | -------- | ------------------- | ------------------------------------------------------- |
| `id`                       | `uuid`        | No       | `gen_random_uuid()` | Identificador interno del agregado.                     |
| `accountId`                | `varchar`     | No       | -                   | Cuenta a la que pertenece el agregado.                  |
| `period`                   | `varchar(7)`  | No       | -                   | Periodo mensual calendario en formato `YYYY-MM`.        |
| `whatsappReservationsUsed` | `integer`     | No       | `0`                 | Cantidad de reservas WhatsApp consumidas en el periodo. |
| `createdAt`                | `timestamptz` | No       | `now()`             | Fecha de creacion del registro.                         |
| `updatedAt`                | `timestamptz` | No       | `now()`             | Fecha de ultima actualizacion del registro.             |

Indices:

- `IDX_monthly_usage_account_period_unique`: unique sobre `accountId` + `period`.

Claves y relaciones:

- Primary key: `id`.
- Foreign key: `accountId` -> `accounts.id` con `CASCADE`.

Reglas de uso:

- Debe existir como maximo una fila por cuenta y periodo.
- Si no existe la fila mensual, el consumo la crea con `whatsappReservationsUsed = 0` antes de incrementar.
- El incremento se hace dentro de una transaccion y solo si `whatsappReservationsUsed < monthlyWhatsappReservationLimit`.
- La compensacion decrementa con piso en cero usando `GREATEST("whatsappReservationsUsed" - 1, 0)`.

Codigo relacionado:

- `src/modules/billing-usage/entities/monthly-usage.entity.ts`
- `src/modules/billing-usage/domain/repository/billing-usage.repository.ts`

## Datos iniciales

La migracion inicial crea datos minimos para que una base nueva pueda operar en el MVP:

| Tabla           | Datos                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `accounts`      | `id = default`, `name = Default restaurant`                                                                                |
| `plans`         | `code = mvp_default`, `name = MVP Default`, `monthlyWhatsappReservationLimit = 1000`, `isActive = true`                    |
| `subscriptions` | Suscripcion `active` para `accountId = default`, vigente desde `2020-01-01T00:00:00.000Z` hasta `2100-01-01T00:00:00.000Z` |

## Flujo de consumo

1. El guard de WhatsApp consulta si la cuenta default puede procesar mensajes segun suscripcion, plan y uso mensual.
2. Cuando una reserva WhatsApp completa esta por encolarse, se registra el consumo en una transaccion.
3. La transaccion inserta `usage_events` de forma idempotente.
4. Si el evento es nuevo, asegura la fila de `monthly_usage` del periodo e incrementa `whatsappReservationsUsed`.
5. Si el limite se alcanzo entre el pre-check y el consumo, la transaccion no incrementa y la reserva no se encola.
6. Si la creacion falla antes de quedar encolada o falla de forma confirmada, se intenta liberar el cupo eliminando el evento y decrementando el agregado.

## Convenciones

- Los periodos mensuales usan formato `YYYY-MM`.
- Las fechas de vigencia y eventos se guardan como `timestamptz`.
- Las migraciones usan `pgcrypto` para `gen_random_uuid()`.
- TypeORM esta configurado con `synchronize: false`; los cambios de esquema deben entrar por migraciones.
