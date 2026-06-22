import { LessThan, MoreThan } from 'typeorm';
import { ReservationContextStatus, UpsertReservationContextInput } from 'src/lib';
import { ReservationContext } from '../../entities';
import {
  createReservationContextRepositoryMock,
  updateResult,
  upsertResult,
} from '../../test/mocks/dependency-mocks';
import { ReservationContextRepository } from './reservation-context.repository';

describe('ReservationContextRepository', () => {
  const now = new Date('2026-06-22T12:00:00.000Z');
  const reservationStartsAt = new Date('2026-06-23T21:00:00.000Z');
  const reservationEndsAt = new Date('2026-06-23T23:00:00.000Z');
  const contextInput: UpsertReservationContextInput = {
    waId: '5491112345678',
    phone: '5491112345678',
    reservationDate: 'martes 23 de junio 2026 23/06/2026',
    reservationTime: '21:00',
    reservationStartsAt,
    reservationEndsAt,
    name: 'Guido',
    quantity: 4,
    lastConversationSummary: 'Reserva confirmada para Guido, 4 personas.',
  };
  const activeContext: ReservationContext = {
    id: 'context-1',
    ...contextInput,
    status: ReservationContextStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
  };

  let repositoryMock = createReservationContextRepositoryMock();
  let repository: ReservationContextRepository;

  beforeEach(() => {
    repositoryMock = createReservationContextRepositoryMock();
    repository = new ReservationContextRepository(repositoryMock as never);
  });

  it('should upsert a complete context as active and return the saved row', async () => {
    repositoryMock.upsert.mockResolvedValue(upsertResult());
    repositoryMock.findOne.mockResolvedValue(activeContext);

    await expect(repository.upsertActiveContext(contextInput)).resolves.toEqual(activeContext);

    expect(repositoryMock.upsert).toHaveBeenCalledWith(
      {
        ...contextInput,
        status: ReservationContextStatus.ACTIVE,
      },
      ['waId'],
    );
    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: { waId: contextInput.waId },
    });
  });

  it('should reject incomplete context input before upserting', async () => {
    await expect(
      repository.upsertActiveContext({
        ...contextInput,
        waId: ' ',
      }),
    ).rejects.toThrow('Reservation context waId is required');

    expect(repositoryMock.upsert).not.toHaveBeenCalled();
  });

  it('should reject non-positive quantity before upserting', async () => {
    await expect(
      repository.upsertActiveContext({
        ...contextInput,
        quantity: 0,
      }),
    ).rejects.toThrow('Reservation context quantity must be a positive integer');

    expect(repositoryMock.upsert).not.toHaveBeenCalled();
  });

  it('should reject an end date that is not after the start date', async () => {
    await expect(
      repository.upsertActiveContext({
        ...contextInput,
        reservationEndsAt: contextInput.reservationStartsAt,
      }),
    ).rejects.toThrow('Reservation context end must be after start');

    expect(repositoryMock.upsert).not.toHaveBeenCalled();
  });

  it('should throw when upsert does not produce a readable row', async () => {
    repositoryMock.upsert.mockResolvedValue(upsertResult());
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(repository.upsertActiveContext(contextInput)).rejects.toThrow(
      `Reservation context upsert failed for waId ${contextInput.waId}`,
    );
  });

  it('should find active context by waId when the reservation has not ended', async () => {
    repositoryMock.findOne.mockResolvedValue(activeContext);

    await expect(repository.findActiveByWaId(contextInput.waId, now)).resolves.toBe(activeContext);

    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        waId: contextInput.waId,
        status: ReservationContextStatus.ACTIVE,
        reservationEndsAt: MoreThan(now),
      },
    });
  });

  it('should return null when no active context exists', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(repository.findActiveByWaId(contextInput.waId, now)).resolves.toBeNull();
  });

  it('should mark a user context as cancelled', async () => {
    repositoryMock.update.mockResolvedValue(updateResult(1));

    await expect(repository.markCancelledByWaId(contextInput.waId)).resolves.toEqual({
      affected: 1,
    });

    expect(repositoryMock.update).toHaveBeenCalledWith(
      { waId: contextInput.waId },
      { status: ReservationContextStatus.CANCELLED },
    );
  });

  it('should return zero affected rows when cancelling a missing context', async () => {
    repositoryMock.update.mockResolvedValue(updateResult(0));

    await expect(repository.markCancelledByWaId(contextInput.waId)).resolves.toEqual({
      affected: 0,
    });
  });

  it('should mark active contexts ended before cutoff as expired', async () => {
    const cutoffDate = new Date('2026-06-24T00:00:00.000Z');
    repositoryMock.update.mockResolvedValue(updateResult(2));

    await expect(repository.markExpiredBefore(cutoffDate)).resolves.toEqual({
      affected: 2,
    });

    expect(repositoryMock.update).toHaveBeenCalledWith(
      {
        status: ReservationContextStatus.ACTIVE,
        reservationEndsAt: LessThan(cutoffDate),
      },
      { status: ReservationContextStatus.EXPIRED },
    );
  });
});
