import { Injectable } from '@nestjs/common';
import {
  ReservationContextErrorCode,
  ReservationContextOperationResult,
  ReservationContextResult,
  SaveReservationContextInput,
} from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContext } from '../entities';
import { ReservationContextNormalizerService } from '../service/reservation-context-normalizer.service';
import { ReservationContextValidationService } from '../service/reservation-context-validation.service';

@Injectable()
export class SaveReservationContextUseCase {
  constructor(
    private readonly reservationContextRepository: ReservationContextRepository,
    private readonly normalizer: ReservationContextNormalizerService,
    private readonly validationService: ReservationContextValidationService,
  ) {}

  async execute(input: SaveReservationContextInput): Promise<ReservationContextOperationResult> {
    const normalizedInput = this.normalizer.normalizeSaveInput(input);
    const validation = this.validationService.validateSaveInput(normalizedInput);

    if (!validation.valid) {
      return {
        success: false,
        errorCode: validation.errorCode,
        message: validation.message,
      };
    }

    try {
      const context = await this.reservationContextRepository.upsertActiveContext(normalizedInput);

      return {
        success: true,
        context: this.mapContextResult(context),
      };
    } catch (error) {
      return {
        success: false,
        errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
        message: error instanceof Error ? error.message : 'Reservation context persistence failed',
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
