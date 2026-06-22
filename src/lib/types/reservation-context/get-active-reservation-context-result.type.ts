import { ReservationContextAbsenceReason } from './reservation-context-absence-reason.enum';
import { ReservationContextErrorCode } from './reservation-context-error-code.enum';
import { ReservationContextResult } from './reservation-context.type';

export type GetActiveReservationContextResult =
  | {
      found: true;
      context: ReservationContextResult;
    }
  | {
      found: false;
      reason: ReservationContextAbsenceReason;
      errorCode?: ReservationContextErrorCode;
      message?: string;
    };
