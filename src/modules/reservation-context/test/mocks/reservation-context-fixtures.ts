import {
  ReservationContextResult,
  ReservationContextStatus,
  SaveReservationContextInput,
} from 'src/lib';
import { ReservationContext } from '../../entities';

export const reservationContextNow = new Date('2026-06-22T12:00:00.000Z');
export const reservationContextStartsAt = new Date('2026-06-23T21:00:00.000Z');
export const reservationContextEndsAt = new Date('2026-06-23T23:00:00.000Z');

export const reservationContextInputFixture = (
  overrides: Partial<SaveReservationContextInput> = {},
): SaveReservationContextInput => ({
  waId: '5491112345678',
  phone: '5491112345678',
  reservationDate: 'martes 23 de junio 2026 23/06/2026',
  reservationTime: '21:00',
  reservationStartsAt: reservationContextStartsAt,
  reservationEndsAt: reservationContextEndsAt,
  name: 'Guido',
  quantity: 4,
  lastConversationSummary: 'Reserva confirmada para Guido, 4 personas.',
  ...overrides,
});

export const reservationContextEntityFixture = (
  overrides: Partial<ReservationContext> = {},
): ReservationContext => ({
  id: 'context-1',
  ...reservationContextInputFixture(),
  status: ReservationContextStatus.ACTIVE,
  createdAt: reservationContextNow,
  updatedAt: reservationContextNow,
  ...overrides,
});

export const reservationContextResultFixture = (
  overrides: Partial<ReservationContextResult> = {},
): ReservationContextResult => {
  const entity = reservationContextEntityFixture();

  return {
    id: entity.id,
    waId: entity.waId,
    phone: entity.phone,
    reservationDate: entity.reservationDate,
    reservationTime: entity.reservationTime,
    reservationStartsAt: entity.reservationStartsAt,
    reservationEndsAt: entity.reservationEndsAt,
    name: entity.name,
    quantity: entity.quantity,
    lastConversationSummary: entity.lastConversationSummary,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    ...overrides,
  };
};
