import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MarkReservationContextsResult,
  ReservationContextStatus,
  UpsertReservationContextInput,
} from 'src/lib';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { ReservationContext } from '../../entities';

@Injectable()
export class ReservationContextRepository {
  constructor(
    @InjectRepository(ReservationContext)
    private readonly reservationContextRepository: Repository<ReservationContext>,
  ) {}

  async upsertActiveContext(input: UpsertReservationContextInput): Promise<ReservationContext> {
    this.validateUpsertInput(input);

    await this.reservationContextRepository.upsert(
      {
        ...input,
        status: ReservationContextStatus.ACTIVE,
      },
      ['waId'],
    );

    const context = await this.reservationContextRepository.findOne({
      where: { waId: input.waId },
    });

    if (!context) {
      throw new Error(`Reservation context upsert failed for waId ${input.waId}`);
    }

    return context;
  }

  findActiveByWaId(waId: string, now: Date): Promise<ReservationContext | null> {
    return this.reservationContextRepository.findOne({
      where: {
        waId,
        status: ReservationContextStatus.ACTIVE,
        reservationEndsAt: MoreThan(now),
      },
    });
  }

  async markCancelledByWaId(waId: string): Promise<MarkReservationContextsResult> {
    const result = await this.reservationContextRepository.update(
      { waId },
      { status: ReservationContextStatus.CANCELLED },
    );

    return { affected: result.affected ?? 0 };
  }

  async markExpiredBefore(cutoffDate: Date): Promise<MarkReservationContextsResult> {
    const result = await this.reservationContextRepository.update(
      {
        status: ReservationContextStatus.ACTIVE,
        reservationEndsAt: LessThan(cutoffDate),
      },
      { status: ReservationContextStatus.EXPIRED },
    );

    return { affected: result.affected ?? 0 };
  }

  private validateUpsertInput(input: UpsertReservationContextInput): void {
    const requiredTextFields = [
      ['waId', input.waId],
      ['phone', input.phone],
      ['reservationDate', input.reservationDate],
      ['reservationTime', input.reservationTime],
      ['name', input.name],
    ] as const;

    const missingField = requiredTextFields.find(([, value]) => value.trim().length === 0);

    if (missingField) {
      throw new Error(`Reservation context ${missingField[0]} is required`);
    }

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new Error('Reservation context quantity must be a positive integer');
    }

    if (input.reservationEndsAt <= input.reservationStartsAt) {
      throw new Error('Reservation context end must be after start');
    }
  }
}
