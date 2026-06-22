import { Injectable } from '@nestjs/common';
import { SaveReservationContextInput } from 'src/lib';

@Injectable()
export class ReservationContextNormalizerService {
  normalizeSaveInput(input: SaveReservationContextInput): SaveReservationContextInput {
    return {
      waId: this.normalizePhoneIdentifier(input.waId),
      phone: this.normalizePhoneIdentifier(input.phone),
      reservationDate: input.reservationDate.trim(),
      reservationTime: input.reservationTime.trim(),
      reservationStartsAt: input.reservationStartsAt,
      reservationEndsAt: input.reservationEndsAt,
      name: input.name.trim(),
      quantity: input.quantity,
      lastConversationSummary:
        input.lastConversationSummary === null || input.lastConversationSummary === undefined
          ? input.lastConversationSummary
          : input.lastConversationSummary.trim(),
    };
  }

  normalizeWaId(waId: string): string {
    return this.normalizePhoneIdentifier(waId);
  }

  private normalizePhoneIdentifier(value: string): string {
    return value
      .trim()
      .replace(/^whatsapp:/i, '')
      .replace(/\D/g, '');
  }
}
