import { Test, TestingModule } from '@nestjs/testing';
import { ReservationContextAbsenceReason, ReservationContextErrorCode } from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContextNormalizerService } from '../service/reservation-context-normalizer.service';
import {
  createReservationContextDomainRepositoryMock,
  ReservationContextDomainRepositoryMock,
} from '../test/mocks/dependency-mocks';
import {
  reservationContextEntityFixture,
  reservationContextNow,
} from '../test/mocks/reservation-context-fixtures';
import { GetActiveReservationContextUseCase } from './get-active-reservation-context.use-case';

describe('GetActiveReservationContextUseCase', () => {
  let useCase: GetActiveReservationContextUseCase;
  let repository: ReservationContextDomainRepositoryMock;

  beforeEach(async () => {
    repository = createReservationContextDomainRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveReservationContextUseCase,
        ReservationContextNormalizerService,
        {
          provide: ReservationContextRepository,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get(GetActiveReservationContextUseCase);
  });

  it('should return found context when repository finds an active context', async () => {
    const activeContext = reservationContextEntityFixture();
    repository.findActiveByWaId.mockResolvedValue(activeContext);

    await expect(
      useCase.execute(' whatsapp:+54 9 11 1234-5678 ', reservationContextNow),
    ).resolves.toEqual({
      found: true,
      context: {
        id: activeContext.id,
        waId: activeContext.waId,
        phone: activeContext.phone,
        reservationDate: activeContext.reservationDate,
        reservationTime: activeContext.reservationTime,
        reservationStartsAt: activeContext.reservationStartsAt,
        reservationEndsAt: activeContext.reservationEndsAt,
        name: activeContext.name,
        quantity: activeContext.quantity,
        lastConversationSummary: activeContext.lastConversationSummary,
        createdAt: activeContext.createdAt,
        updatedAt: activeContext.updatedAt,
      },
    });
    expect(repository.findActiveByWaId).toHaveBeenCalledWith(
      '5491112345678',
      reservationContextNow,
    );
  });

  it('should return explicit absence when repository does not find context', async () => {
    repository.findActiveByWaId.mockResolvedValue(null);

    await expect(useCase.execute('5491112345678', reservationContextNow)).resolves.toEqual({
      found: false,
      reason: ReservationContextAbsenceReason.NOT_FOUND,
    });
  });

  it('should return persistence failure when lookup fails', async () => {
    repository.findActiveByWaId.mockRejectedValue(new Error('database unavailable'));

    await expect(useCase.execute('5491112345678', reservationContextNow)).resolves.toEqual({
      found: false,
      reason: ReservationContextAbsenceReason.NOT_FOUND,
      errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
      message: 'database unavailable',
    });
  });
});
