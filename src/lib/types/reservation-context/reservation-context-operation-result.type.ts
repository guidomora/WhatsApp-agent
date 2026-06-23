import { ReservationContextErrorCode } from './reservation-context-error-code.enum';
import { ReservationContextResult } from './reservation-context.type';

export type ReservationContextOperationResult =
  | {
      success: true;
      context?: ReservationContextResult;
      affected?: number;
    }
  | {
      success: false;
      errorCode: ReservationContextErrorCode;
      message: string;
    };
