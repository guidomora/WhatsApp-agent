import { ReservationContextErrorCode } from 'src/lib';
import { reservationContextInputFixture } from '../test/mocks/reservation-context-fixtures';
import { ReservationContextValidationService } from './reservation-context-validation.service';

describe('ReservationContextValidationService', () => {
  let service: ReservationContextValidationService;

  beforeEach(() => {
    service = new ReservationContextValidationService();
  });

  it('should accept a complete save input', () => {
    expect(service.validateSaveInput(reservationContextInputFixture())).toEqual({ valid: true });
  });

  it('should reject blank required text fields', () => {
    expect(
      service.validateSaveInput(
        reservationContextInputFixture({
          waId: ' ',
        }),
      ),
    ).toEqual({
      valid: false,
      errorCode: ReservationContextErrorCode.REQUIRED_FIELD_MISSING,
      message: 'Reservation context waId is required',
    });
  });

  it('should reject non-positive quantities', () => {
    expect(
      service.validateSaveInput(
        reservationContextInputFixture({
          quantity: 0,
        }),
      ),
    ).toEqual({
      valid: false,
      errorCode: ReservationContextErrorCode.INVALID_QUANTITY,
      message: 'Reservation context quantity must be a positive integer',
    });
  });

  it('should reject an invalid reservation time window', () => {
    const startsAt = new Date('2026-06-23T23:00:00.000Z');

    expect(
      service.validateSaveInput(
        reservationContextInputFixture({
          reservationStartsAt: startsAt,
          reservationEndsAt: startsAt,
        }),
      ),
    ).toEqual({
      valid: false,
      errorCode: ReservationContextErrorCode.INVALID_TIME_WINDOW,
      message: 'Reservation context end must be after start',
    });
  });

  it('should reject overlong conversation summaries', () => {
    expect(
      service.validateSaveInput(
        reservationContextInputFixture({
          lastConversationSummary: 'a'.repeat(501),
        }),
      ),
    ).toEqual({
      valid: false,
      errorCode: ReservationContextErrorCode.SUMMARY_TOO_LONG,
      message: 'Reservation context summary must be 500 characters or less',
    });
  });

  it('should reject summaries that look like a full transcript', () => {
    expect(
      service.validateSaveInput(
        reservationContextInputFixture({
          lastConversationSummary: 'Usuario: hola\nBot: hola\nUsuario: quiero reservar',
        }),
      ),
    ).toEqual({
      valid: false,
      errorCode: ReservationContextErrorCode.SUMMARY_LOOKS_LIKE_TRANSCRIPT,
      message: 'Reservation context summary must not contain a full conversation transcript',
    });
  });
});
