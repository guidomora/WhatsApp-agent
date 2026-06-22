import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationContextRepository } from './domain/repository/reservation-context.repository';
import { ReservationContext } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationContext])],
  providers: [ReservationContextRepository],
  exports: [ReservationContextRepository],
})
export class ReservationContextModule {}
