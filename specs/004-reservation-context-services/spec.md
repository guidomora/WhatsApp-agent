# Feature Specification: Reservation Context Services

**Feature Branch**: `feat/reservation-context-services`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "vamos a trabajar en la feature que sirve para guardar contexto de la utlima conversacion. En la DB 003-reservation-context-storage tenes toda la info de lo que se hizo en la fase 1 por si queres leerlo y tener mas contexto. Lo que vamos a hacer en esta fase 2 es en el nuevo modulo ReservationContextModule encargarnos de los services y demas logica de la aplicacion. Crea un nuevo spec para esta fase 2 pero lee el spec de la fase 1 asi todo esta conectado"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Guardar contexto accionable desde una reserva confirmada (Priority: P1)

Como bot de reservas, quiero registrar un contexto estructurado de la ultima reserva accionable de un usuario cuando existe informacion suficiente, para que futuras interacciones puedan recuperar esa reserva sin depender de la cache conversacional.

**Why this priority**: Es el objetivo principal de fase 2. La fase 1 dejo disponible el almacenamiento; esta fase debe convertirlo en una capacidad de aplicacion reutilizable y validada.

**Independent Test**: Se puede probar entregando datos completos de una reserva confirmada para un usuario de WhatsApp y verificando que queda disponible como su contexto activo mas reciente.

**Acceptance Scenarios**:

1. **Given** un usuario de WhatsApp sin contexto activo, **When** se solicita guardar un contexto completo de una reserva confirmada, **Then** el sistema conserva ese contexto como la ultima reserva accionable del usuario.
2. **Given** un usuario de WhatsApp con un contexto activo previo, **When** se solicita guardar un nuevo contexto completo de una reserva confirmada, **Then** el sistema reemplaza el contexto previo por el nuevo.
3. **Given** una solicitud de guardado con datos obligatorios incompletos o invalidos, **When** el sistema intenta registrar el contexto, **Then** el contexto no queda disponible como activo y se informa el motivo del rechazo a la capa que lo solicito.

---

### User Story 2 - Recuperar contexto para acciones posteriores (Priority: P2)

Como flujo de modificacion o cancelacion de reservas, quiero obtener el contexto activo de un usuario de WhatsApp en formato confiable, para poder asistir una accion posterior aun cuando el historial conversacional reciente ya no este disponible.

**Why this priority**: La recuperacion usable es lo que hace valioso al contexto persistente para fases posteriores de actualizar o cancelar reservas.

**Independent Test**: Se puede probar consultando un usuario con contexto activo, cancelado, expirado y sin contexto para verificar que solo el caso activo devuelve datos utilizables.

**Acceptance Scenarios**:

1. **Given** un usuario con contexto activo y no vencido, **When** una capacidad consumidora solicita su contexto, **Then** el sistema devuelve los datos estructurados necesarios para identificar la reserva.
2. **Given** un usuario sin contexto activo, **When** se solicita su contexto, **Then** el sistema devuelve ausencia de contexto sin inventar ni inferir datos.
3. **Given** un usuario con contexto cancelado, expirado o ya finalizado, **When** se solicita su contexto, **Then** el sistema no lo entrega como contexto accionable.

---

### User Story 3 - Invalidar contexto cuando deja de ser accionable (Priority: P3)

Como negocio, quiero que la capacidad de contexto pueda marcar una reserva como no accionable cuando se cancela o ya no corresponde usarla, para evitar que futuros flujos operen sobre informacion obsoleta.

**Why this priority**: Evita acciones incorrectas sobre reservas que ya no representan una intencion valida del usuario.

**Independent Test**: Se puede probar invalidando el contexto de un usuario y verificando que consultas posteriores ya no lo recuperan como activo.

**Acceptance Scenarios**:

1. **Given** un usuario con contexto activo, **When** se solicita invalidarlo por cancelacion, **Then** deja de estar disponible para acciones futuras.
2. **Given** un usuario sin contexto existente, **When** se solicita invalidarlo, **Then** la operacion finaliza sin crear contexto nuevo ni producir error de negocio.
3. **Given** contextos activos que finalizaron antes de un punto de corte, **When** se solicita marcarlos como vencidos, **Then** dejan de estar disponibles como accionables.

---

### User Story 4 - Proteger el limite de privacidad del contexto (Priority: P4)

Como responsable del sistema, quiero que la logica de contexto siga almacenando solo un resumen estructurado y minimo, para no persistir conversaciones completas ni datos que no sean necesarios para operar la ultima reserva.

**Why this priority**: Mantiene la decision de fase 1 y reduce el riesgo de privacidad al convertir el almacenamiento en una capacidad consumida por otros flujos.

**Independent Test**: Se puede probar enviando una solicitud con resumen opcional y verificando que solo se aceptan datos estructurados de reserva y un resumen breve, nunca un transcript completo.

**Acceptance Scenarios**:

1. **Given** una solicitud que incluye informacion de conversacion extensa, **When** se intenta guardar como contexto, **Then** el sistema no conserva el transcript completo como parte del contexto accionable.
2. **Given** una solicitud con datos de reserva completos y un resumen breve, **When** se guarda el contexto, **Then** el sistema conserva solo los campos necesarios para recuperar la reserva y asistir futuras acciones.

### Edge Cases

- Si faltan identificador de WhatsApp, telefono operativo, fecha, hora, nombre, cantidad o ventana temporal de reserva, el contexto no debe guardarse como activo.
- Si la cantidad de personas no es positiva, el contexto debe rechazarse.
- Si la hora de finalizacion no es posterior a la hora de inicio, el contexto debe rechazarse.
- Si el identificador de WhatsApp o el telefono operativo llegan con espacios o formato inconsistente, el sistema debe normalizarlos o rechazarlos de forma consistente antes de guardar.
- Si se intenta recuperar contexto para un usuario cuyo contexto ya termino, el sistema debe tratarlo como ausencia de contexto accionable.
- Si una operacion consumidora repite el guardado del mismo contexto, el resultado debe seguir siendo un unico contexto activo para el usuario.
- Si la persistencia de fase 1 no esta disponible, la capacidad debe reportar la falla a la capa llamadora sin simular un contexto exitoso.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide an application-level capability to save the latest actionable reservation context for a WhatsApp user using the durable storage defined in `003-reservation-context-storage`.
- **FR-002**: The system MUST validate all required reservation context fields before making a context active.
- **FR-003**: The system MUST reject contexts with blank user identifiers, blank operational phone, blank customer name, blank reservation date, blank reservation time, non-positive party quantity, or an invalid reservation time window.
- **FR-004**: The system MUST keep at most one active reservation context per WhatsApp user after any save request.
- **FR-005**: The system MUST replace the previous context when a newer valid context is saved for the same WhatsApp user.
- **FR-006**: The system MUST expose a reusable way for other reservation flows to request the active context of a WhatsApp user.
- **FR-007**: The system MUST return active context only when the stored context belongs to the requested WhatsApp user, is active, and has not passed its reservation end moment.
- **FR-008**: The system MUST return an explicit absence result when no actionable context exists.
- **FR-009**: The system MUST expose a reusable way to mark one user's context as cancelled.
- **FR-010**: The system MUST expose a reusable way to mark active contexts as expired when their reservation ended before a provided cutoff.
- **FR-011**: The system MUST preserve the phase 1 privacy boundary by storing structured reservation data and, at most, a short summary instead of a full conversation transcript.
- **FR-012**: The system MUST report validation and persistence failures to the caller in a way that lets the caller decide whether to ask the user for missing data, retry, or continue without context.
- **FR-013**: The system MUST avoid changing live WhatsApp conversation behavior until a later integration phase explicitly connects this capability to create, update, or cancel flows.
- **FR-014**: The system MUST remain compatible with the lifecycle statuses active, cancelled, and expired defined in phase 1.

### Key Entities _(include if feature involves data)_

- **Reservation Context Request**: The information supplied by an internal reservation flow when it wants to save the latest actionable reservation for a WhatsApp user.
- **Reservation Context Result**: The normalized, validated reservation context returned to internal flows when a user has an actionable context.
- **Context Absence**: An explicit result that indicates no actionable context is available for the requested WhatsApp user.
- **Context Invalidation Request**: A request to make an existing context unavailable for future reservation actions because it was cancelled or has expired.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of valid save requests with complete reservation data result in exactly one active context for the WhatsApp user.
- **SC-002**: 100% of invalid save requests with missing required fields, non-positive quantity, or invalid time windows are rejected before becoming active context.
- **SC-003**: 100% of active-context lookups return usable reservation data only for active, not-yet-ended contexts that belong to the requested WhatsApp user.
- **SC-004**: 100% of cancelled, expired, already-ended, or missing contexts produce an absence result instead of actionable reservation data.
- **SC-005**: Repeated save requests for the same WhatsApp user leave a single latest context in 100% of tested cases.
- **SC-006**: 100% of inspected saved contexts contain structured reservation fields and no full conversation transcript.
- **SC-007**: Existing WhatsApp reservation conversations behave the same as before this phase until an explicit future integration connects them to this capability.

## Assumptions

- Phase 1 storage, data model, statuses, and uniqueness rules from `specs/003-reservation-context-storage` are the source of truth for persisted context.
- This phase focuses on application logic around that storage, not on creating new user-facing WhatsApp behavior.
- Future phases will decide exactly where successful create, update, and cancel flows call this capability.
- The latest actionable reservation per WhatsApp user remains the intended business rule for this feature.
- A short conversation summary is optional and must remain auxiliary; structured reservation fields are the authoritative context.
