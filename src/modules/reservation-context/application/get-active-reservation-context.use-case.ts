import { Injectable } from '@nestjs/common';
import {
  GetActiveReservationContextResult,
  ReservationContextAbsenceReason,
  ReservationContextErrorCode,
  ReservationContextResult,
} from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContext } from '../entities';
import { ReservationContextNormalizerService } from '../service/reservation-context-normalizer.service';

@Injectable()
export class GetActiveReservationContextUseCase {
  constructor(
    private readonly reservationContextRepository: ReservationContextRepository,
    private readonly normalizer: ReservationContextNormalizerService,
  ) {}

  async execute(waId: string, now: Date): Promise<GetActiveReservationContextResult> {
    const normalizedWaId = this.normalizer.normalizeWaId(waId);

    try {
      const context = await this.reservationContextRepository.findActiveByWaId(normalizedWaId, now);

      if (!context) {
        return {
          found: false,
          reason: ReservationContextAbsenceReason.NOT_FOUND,
        };
      }

      return {
        found: true,
        context: this.mapContextResult(context),
      };
    } catch (error) {
      return {
        found: false,
        reason: ReservationContextAbsenceReason.NOT_FOUND,
        errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
        message: error instanceof Error ? error.message : 'Reservation context lookup failed',
      };
    }
  }

  private mapContextResult(context: ReservationContext): ReservationContextResult {
    return {
      id: context.id,
      waId: context.waId,
      phone: context.phone,
      reservationDate: context.reservationDate,
      reservationTime: context.reservationTime,
      reservationStartsAt: context.reservationStartsAt,
      reservationEndsAt: context.reservationEndsAt,
      name: context.name,
      quantity: context.quantity,
      lastConversationSummary: context.lastConversationSummary,
      createdAt: context.createdAt,
      updatedAt: context.updatedAt,
    };
  }
}
