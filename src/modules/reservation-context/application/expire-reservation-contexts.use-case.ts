import { Injectable } from '@nestjs/common';
import { ReservationContextErrorCode, ReservationContextOperationResult } from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContextValidationService } from '../service/reservation-context-validation.service';

@Injectable()
export class ExpireReservationContextsUseCase {
  constructor(
    private readonly reservationContextRepository: ReservationContextRepository,
    private readonly validationService: ReservationContextValidationService,
  ) {}

  async execute(cutoffDate: Date): Promise<ReservationContextOperationResult> {
    const validation = this.validationService.validateCutoffDate(cutoffDate);

    if (!validation.valid) {
      return {
        success: false,
        errorCode: validation.errorCode,
        message: validation.message,
      };
    }

    try {
      const result = await this.reservationContextRepository.markExpiredBefore(cutoffDate);

      return {
        success: true,
        affected: result.affected,
      };
    } catch (error) {
      return {
        success: false,
        errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
        message: error instanceof Error ? error.message : 'Reservation context expiration failed',
      };
    }
  }
}
