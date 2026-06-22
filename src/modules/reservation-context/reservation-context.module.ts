import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancelReservationContextUseCase } from './application/cancel-reservation-context.use-case';
import { ExpireReservationContextsUseCase } from './application/expire-reservation-contexts.use-case';
import { GetActiveReservationContextUseCase } from './application/get-active-reservation-context.use-case';
import { SaveReservationContextUseCase } from './application/save-reservation-context.use-case';
import { ReservationContextRepository } from './domain/repository/reservation-context.repository';
import { ReservationContext } from './entities';
import { ReservationContextNormalizerService } from './service/reservation-context-normalizer.service';
import { ReservationContextValidationService } from './service/reservation-context-validation.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationContext])],
  providers: [
    ReservationContextRepository,
    ReservationContextNormalizerService,
    ReservationContextValidationService,
    CancelReservationContextUseCase,
    ExpireReservationContextsUseCase,
    GetActiveReservationContextUseCase,
    SaveReservationContextUseCase,
  ],
  exports: [
    ReservationContextRepository,
    CancelReservationContextUseCase,
    ExpireReservationContextsUseCase,
    GetActiveReservationContextUseCase,
    SaveReservationContextUseCase,
  ],
})
export class ReservationContextModule {}
