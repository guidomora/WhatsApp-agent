import { Injectable } from '@nestjs/common';
import {
  ReservationContextErrorCode,
  ReservationContextValidationResult,
  SaveReservationContextInput,
} from 'src/lib';

const MAX_CONVERSATION_SUMMARY_LENGTH = 500;
const TRANSCRIPT_SPEAKER_PATTERN = /(?:^|\n)\s*(usuario|user|bot|asistente|assistant)\s*:/gi;

@Injectable()
export class ReservationContextValidationService {
  validateSaveInput(input: SaveReservationContextInput): ReservationContextValidationResult {
    const requiredTextFields = [
      ['waId', input.waId],
      ['phone', input.phone],
      ['reservationDate', input.reservationDate],
      ['reservationTime', input.reservationTime],
      ['name', input.name],
    ] as const;

    const missingField = requiredTextFields.find(([, value]) => value.trim().length === 0);

    if (missingField) {
      return {
        valid: false,
        errorCode: ReservationContextErrorCode.REQUIRED_FIELD_MISSING,
        message: `Reservation context ${missingField[0]} is required`,
      };
    }

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      return {
        valid: false,
        errorCode: ReservationContextErrorCode.INVALID_QUANTITY,
        message: 'Reservation context quantity must be a positive integer',
      };
    }

    if (input.reservationEndsAt <= input.reservationStartsAt) {
      return {
        valid: false,
        errorCode: ReservationContextErrorCode.INVALID_TIME_WINDOW,
        message: 'Reservation context end must be after start',
      };
    }

    const summaryValidation = this.validateConversationSummary(input.lastConversationSummary);

    if (!summaryValidation.valid) {
      return summaryValidation;
    }

    return { valid: true };
  }

  validateCutoffDate(cutoffDate: Date): ReservationContextValidationResult {
    if (Number.isNaN(cutoffDate.getTime())) {
      return {
        valid: false,
        errorCode: ReservationContextErrorCode.INVALID_CUTOFF_DATE,
        message: 'Reservation context expiration cutoff must be a valid date',
      };
    }

    return { valid: true };
  }

  private validateConversationSummary(
    summary: SaveReservationContextInput['lastConversationSummary'],
  ): ReservationContextValidationResult {
    if (!summary) {
      return { valid: true };
    }

    if (summary.length > MAX_CONVERSATION_SUMMARY_LENGTH) {
      return {
        valid: false,
        errorCode: ReservationContextErrorCode.SUMMARY_TOO_LONG,
        message: 'Reservation context summary must be 500 characters or less',
      };
    }

    const speakerMatches = summary.match(TRANSCRIPT_SPEAKER_PATTERN) ?? [];

    if (speakerMatches.length >= 2) {
      return {
        valid: false,
        errorCode: ReservationContextErrorCode.SUMMARY_LOOKS_LIKE_TRANSCRIPT,
        message: 'Reservation context summary must not contain a full conversation transcript',
      };
    }

    return { valid: true };
  }
}
