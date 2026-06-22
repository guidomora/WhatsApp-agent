# Feature Specification: Reservation Context Storage

**Feature Branch**: `feat/reservation-context-storage`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "Fase 1 de guardar contexto sobre conversaciones de WhatsApp en DB. No guardar la conversacion completa. Guardar un snapshot persistente de la ultima reserva accionable por usuario para que, en fases posteriores, el agente pueda asistir pedidos de actualizar o cancelar una reserva luego de que expire la cache conversacional. La limpieza automatica de contextos de reservas pasadas se hara mas adelante."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Registrar contexto persistente de reserva (Priority: P1)

Como sistema de reservas por WhatsApp, quiero conservar un snapshot persistente de la ultima reserva accionable de cada usuario para que esa informacion sobreviva a la expiracion de la cache conversacional.

**Why this priority**: Es la base de Fase 1. Sin un almacenamiento durable del snapshot, las fases posteriores no podran recuperar contexto despues de que la cache se vacie.

**Independent Test**: Se puede probar guardando un snapshot completo para un usuario de WhatsApp y verificando que queda disponible como el unico contexto asociado a ese usuario.

**Acceptance Scenarios**:

1. **Given** un usuario de WhatsApp sin contexto persistente, **When** se registra un snapshot completo de su ultima reserva accionable, **Then** el sistema conserva ese snapshot como contexto activo del usuario.
2. **Given** un usuario de WhatsApp con contexto persistente previo, **When** se registra un nuevo snapshot completo para el mismo usuario, **Then** el sistema reemplaza el contexto previo por el nuevo snapshot.

---

### User Story 2 - Recuperar solo contexto utilizable (Priority: P2)

Como flujo futuro de modificacion o cancelacion, quiero poder consultar el contexto activo de un usuario de WhatsApp para obtener datos estructurados de su ultima reserva sin depender del historial conversacional completo.

**Why this priority**: Permite validar que el dato guardado puede ser usado como fuente auxiliar por los flujos posteriores, manteniendo el alcance limitado a almacenamiento y recuperacion.

**Independent Test**: Se puede probar consultando el contexto de un usuario con snapshot activo y verificando que se devuelven los datos necesarios para identificar su reserva.

**Acceptance Scenarios**:

1. **Given** un usuario con contexto activo y vigente, **When** se consulta su contexto, **Then** el sistema devuelve telefono operativo, fecha, hora, nombre, cantidad y ventana temporal de la reserva.
2. **Given** un usuario sin contexto activo, **When** se consulta su contexto, **Then** el sistema no devuelve datos inferidos.

---

### User Story 3 - Desactivar contextos no accionables (Priority: P3)

Como negocio, quiero que un contexto pueda dejar de ser utilizable cuando la reserva asociada se cancela o expira para evitar que futuras fases usen informacion que ya no representa una reserva accionable.

**Why this priority**: Reduce el riesgo de que una reserva vieja o cancelada sea usada como base para una accion incorrecta.

**Independent Test**: Se puede probar marcando un contexto como cancelado o expirado y verificando que ya no aparece como contexto activo.

**Acceptance Scenarios**:

1. **Given** un usuario con contexto activo, **When** el contexto se marca como cancelado, **Then** deja de devolverse como contexto activo.
2. **Given** varios contextos activos con reserva finalizada antes de un punto de corte, **When** se marcan como expirados, **Then** dejan de devolverse como contextos activos.

---

### Edge Cases

- Si se intenta registrar un snapshot incompleto, el sistema debe rechazarlo o impedir que quede disponible como contexto activo.
- Si el mismo usuario registra una nueva reserva, el contexto anterior debe reemplazarse y no deben existir dos contextos activos para el mismo numero de WhatsApp.
- Si un contexto esta cancelado o expirado, no debe ser recuperado por consultas de contexto activo.
- Si el usuario no tiene contexto persistente, el sistema debe responder sin datos para que los flujos posteriores pidan la informacion faltante.
- La limpieza automatica y periodica de contextos vencidos queda fuera de esta fase; esta fase solo debe permitir marcar contextos como expirados.
- La conexion automatica con los flujos reales de crear, actualizar o cancelar reservas queda fuera de esta fase.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide durable storage for the latest actionable reservation context of each WhatsApp user.
- **FR-002**: The system MUST maintain at most one reservation context per WhatsApp user.
- **FR-003**: The system MUST replace an existing context when a newer complete context is saved for the same WhatsApp user.
- **FR-004**: The system MUST store only structured reservation context data, not the full WhatsApp conversation transcript.
- **FR-005**: Each reservation context MUST include WhatsApp user identifier, operational phone, reservation date, reservation time, reservation start moment, reservation end moment, customer name, party quantity, status, creation moment, update moment, and optional short conversation summary.
- **FR-006**: The system MUST support the context statuses active, cancelled, and expired.
- **FR-007**: The system MUST return a context as active only when it belongs to the requested WhatsApp user, has active status, and has not passed its reservation end moment.
- **FR-008**: The system MUST support marking one user's context as cancelled.
- **FR-009**: The system MUST support marking active contexts that ended before a provided cutoff as expired.
- **FR-010**: The system MUST prevent duplicate contexts for the same WhatsApp user.
- **FR-011**: The system MUST make no user-facing conversational behavior changes in this phase.
- **FR-012**: The system MUST not automatically delete past reservation contexts in this phase.

### Key Entities _(include if feature involves data)_

- **Reservation Context**: A durable snapshot of the latest actionable reservation for one WhatsApp user. It includes identifiers, reservation details, lifecycle status, optional short summary, and lifecycle timestamps.
- **WhatsApp User**: A person messaging the bot from a specific WhatsApp identifier. For this phase, one WhatsApp user can have at most one reservation context.
- **Context Status**: The lifecycle state that determines whether a reservation context can be used by future flows. Valid states are active, cancelled, and expired.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Saving a complete context for a WhatsApp user results in exactly one retrievable active context for that user.
- **SC-002**: Saving a second complete context for the same WhatsApp user replaces the previous context in 100% of tested cases.
- **SC-003**: Active context lookup excludes cancelled, expired, and already-ended contexts in 100% of tested cases.
- **SC-004**: The stored context contains structured reservation fields and no full conversation transcript in 100% of inspected saved contexts.
- **SC-005**: Users without an active context produce an empty context result, preserving existing missing-data behavior for later flows.

## Assumptions

- Each WhatsApp number maps to one actionable reservation context at a time.
- The operational phone is stored separately from the WhatsApp identifier because it is the value used to identify reservations.
- Reservation date and time are preserved as user/business-facing values, while start and end moments support active/expired decisions.
- Automatic cleanup of contexts after reservations pass is intentionally out of scope for this phase.
- Connecting this storage to real create, update, and cancel flows will happen in later phases.
