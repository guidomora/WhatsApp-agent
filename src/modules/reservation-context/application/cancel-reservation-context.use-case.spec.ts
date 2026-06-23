import { Test, TestingModule } from '@nestjs/testing';
import { ReservationContextErrorCode } from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContextNormalizerService } from '../service/reservation-context-normalizer.service';
import {
  createReservationContextDomainRepositoryMock,
  ReservationContextDomainRepositoryMock,
} from '../test/mocks/dependency-mocks';
import { CancelReservationContextUseCase } from './cancel-reservation-context.use-case';

describe('CancelReservationContextUseCase', () => {
  let useCase: CancelReservationContextUseCase;
  let repository: ReservationContextDomainRepositoryMock;

  beforeEach(async () => {
    repository = createReservationContextDomainRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelReservationContextUseCase,
        ReservationContextNormalizerService,
        {
          provide: ReservationContextRepository,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get(CancelReservationContextUseCase);
  });

  it('should cancel context for normalized WhatsApp identifier', async () => {
    repository.markCancelledByWaId.mockResolvedValue({ affected: 1 });

    await expect(useCase.execute(' whatsapp:+54 9 11 1234-5678 ')).resolves.toEqual({
      success: true,
      affected: 1,
    });
    expect(repository.markCancelledByWaId).toHaveBeenCalledWith('5491112345678');
  });

  it('should treat missing context as a successful no-op', async () => {
    repository.markCancelledByWaId.mockResolvedValue({ affected: 0 });

    await expect(useCase.execute('5491112345678')).resolves.toEqual({
      success: true,
      affected: 0,
    });
  });

  it('should return persistence failure when cancellation fails', async () => {
    repository.markCancelledByWaId.mockRejectedValue(new Error('database unavailable'));

    await expect(useCase.execute('5491112345678')).resolves.toEqual({
      success: false,
      errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
      message: 'database unavailable',
    });
  });
});
