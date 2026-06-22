import { Test, TestingModule } from '@nestjs/testing';
import { ReservationContextErrorCode } from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContextValidationService } from '../service/reservation-context-validation.service';
import {
  createReservationContextDomainRepositoryMock,
  ReservationContextDomainRepositoryMock,
} from '../test/mocks/dependency-mocks';
import { ExpireReservationContextsUseCase } from './expire-reservation-contexts.use-case';

describe('ExpireReservationContextsUseCase', () => {
  let useCase: ExpireReservationContextsUseCase;
  let repository: ReservationContextDomainRepositoryMock;

  beforeEach(async () => {
    repository = createReservationContextDomainRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpireReservationContextsUseCase,
        ReservationContextValidationService,
        {
          provide: ReservationContextRepository,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get(ExpireReservationContextsUseCase);
  });

  it('should expire active contexts before a valid cutoff', async () => {
    const cutoffDate = new Date('2026-06-24T00:00:00.000Z');
    repository.markExpiredBefore.mockResolvedValue({ affected: 2 });

    await expect(useCase.execute(cutoffDate)).resolves.toEqual({
      success: true,
      affected: 2,
    });
    expect(repository.markExpiredBefore).toHaveBeenCalledWith(cutoffDate);
  });

  it('should reject invalid cutoff dates before persistence', async () => {
    const invalidDate = new Date(Number.NaN);

    await expect(useCase.execute(invalidDate)).resolves.toEqual({
      success: false,
      errorCode: ReservationContextErrorCode.INVALID_CUTOFF_DATE,
      message: 'Reservation context expiration cutoff must be a valid date',
    });
    expect(repository.markExpiredBefore).not.toHaveBeenCalled();
  });

  it('should return persistence failure when expiration fails', async () => {
    const cutoffDate = new Date('2026-06-24T00:00:00.000Z');
    repository.markExpiredBefore.mockRejectedValue(new Error('database unavailable'));

    await expect(useCase.execute(cutoffDate)).resolves.toEqual({
      success: false,
      errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
      message: 'database unavailable',
    });
  });
});
