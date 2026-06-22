import { ReservationContextErrorCode } from './reservation-context-error-code.enum';

export type ReservationContextValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      errorCode: ReservationContextErrorCode;
      message: string;
    };
