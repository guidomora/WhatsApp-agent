import { Injectable } from '@nestjs/common';
import { ReservationContextErrorCode, ReservationContextOperationResult } from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContextNormalizerService } from '../service/reservation-context-normalizer.service';

@Injectable()
export class CancelReservationContextUseCase {
  constructor(
    private readonly reservationContextRepository: ReservationContextRepository,
    private readonly normalizer: ReservationContextNormalizerService,
  ) {}

  async execute(waId: string): Promise<ReservationContextOperationResult> {
    const normalizedWaId = this.normalizer.normalizeWaId(waId);

    try {
      const result = await this.reservationContextRepository.markCancelledByWaId(normalizedWaId);

      return {
        success: true,
        affected: result.affected,
      };
    } catch (error) {
      return {
        success: false,
        errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
        message: error instanceof Error ? error.message : 'Reservation context cancellation failed',
      };
    }
  }
}
