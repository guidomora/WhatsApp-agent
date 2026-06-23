import { ReservationContextNormalizerService } from './reservation-context-normalizer.service';
import { reservationContextInputFixture } from '../test/mocks/reservation-context-fixtures';

describe('ReservationContextNormalizerService', () => {
  let service: ReservationContextNormalizerService;

  beforeEach(() => {
    service = new ReservationContextNormalizerService();
  });

  it('should trim text fields and normalize phone identifiers', () => {
    const input = reservationContextInputFixture({
      waId: ' whatsapp:+54 9 11 1234-5678 ',
      phone: ' +54 9 11 1234-5678 ',
      reservationDate: ' martes 23 de junio ',
      reservationTime: ' 21:00 ',
      name: ' Guido ',
      lastConversationSummary: ' Reserva confirmada. ',
    });

    expect(service.normalizeSaveInput(input)).toEqual({
      ...input,
      waId: '5491112345678',
      phone: '5491112345678',
      reservationDate: 'martes 23 de junio',
      reservationTime: '21:00',
      name: 'Guido',
      lastConversationSummary: 'Reserva confirmada.',
    });
  });

  it('should preserve null optional summary while normalizing required fields', () => {
    const input = reservationContextInputFixture({
      waId: ' 5491112345678 ',
      phone: ' 5491112345678 ',
      lastConversationSummary: null,
    });

    expect(service.normalizeSaveInput(input).lastConversationSummary).toBeNull();
    expect(service.normalizeSaveInput(input).waId).toBe('5491112345678');
  });

  it('should normalize a standalone WhatsApp identifier', () => {
    expect(service.normalizeWaId(' whatsapp:+54 9 11 1234-5678 ')).toBe('5491112345678');
  });
});
