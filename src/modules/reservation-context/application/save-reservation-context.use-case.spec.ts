import { Test, TestingModule } from '@nestjs/testing';
import {
  ReservationContextErrorCode,
  ReservationContextOperationResult,
  SaveReservationContextInput,
} from 'src/lib';
import { ReservationContextRepository } from '../domain/repository/reservation-context.repository';
import { ReservationContextNormalizerService } from '../service/reservation-context-normalizer.service';
import { ReservationContextValidationService } from '../service/reservation-context-validation.service';
import {
  createReservationContextDomainRepositoryMock,
  ReservationContextDomainRepositoryMock,
} from '../test/mocks/dependency-mocks';
import {
  reservationContextEntityFixture,
  reservationContextInputFixture,
} from '../test/mocks/reservation-context-fixtures';
import { SaveReservationContextUseCase } from './save-reservation-context.use-case';

describe('SaveReservationContextUseCase', () => {
  let useCase: SaveReservationContextUseCase;
  let repository: ReservationContextDomainRepositoryMock;

  beforeEach(async () => {
    repository = createReservationContextDomainRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveReservationContextUseCase,
        ReservationContextNormalizerService,
        ReservationContextValidationService,
        {
          provide: ReservationContextRepository,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get(SaveReservationContextUseCase);
  });

  it('should save normalized valid context and return the saved context result', async () => {
    const input = reservationContextInputFixture({
      waId: ' whatsapp:+54 9 11 1234-5678 ',
      phone: ' +54 9 11 1234-5678 ',
      name: ' Guido ',
    });
    const savedContext = reservationContextEntityFixture({
      waId: '5491112345678',
      phone: '5491112345678',
      name: 'Guido',
    });
    repository.upsertActiveContext.mockResolvedValue(savedContext);

    await expect(useCase.execute(input)).resolves.toEqual({
      success: true,
      context: {
        id: savedContext.id,
        waId: savedContext.waId,
        phone: savedContext.phone,
        reservationDate: savedContext.reservationDate,
        reservationTime: savedContext.reservationTime,
        reservationStartsAt: savedContext.reservationStartsAt,
        reservationEndsAt: savedContext.reservationEndsAt,
        name: savedContext.name,
        quantity: savedContext.quantity,
        lastConversationSummary: savedContext.lastConversationSummary,
        createdAt: savedContext.createdAt,
        updatedAt: savedContext.updatedAt,
      },
    } satisfies ReservationContextOperationResult);

    expect(repository.upsertActiveContext).toHaveBeenCalledWith({
      ...input,
      waId: '5491112345678',
      phone: '5491112345678',
      name: 'Guido',
    });
  });

  it('should replace previous context through repository upsert behavior', async () => {
    const input = reservationContextInputFixture();
    repository.upsertActiveContext.mockResolvedValue(reservationContextEntityFixture());

    await useCase.execute(input);
    await useCase.execute({
      ...input,
      reservationTime: '22:00',
    });

    expect(repository.upsertActiveContext).toHaveBeenCalledTimes(2);
  });

  it('should return validation failure and skip persistence for invalid input', async () => {
    const result = await useCase.execute(
      reservationContextInputFixture({
        waId: ' ',
      }),
    );

    expect(result).toEqual({
      success: false,
      errorCode: ReservationContextErrorCode.REQUIRED_FIELD_MISSING,
      message: 'Reservation context waId is required',
    });
    expect(repository.upsertActiveContext).not.toHaveBeenCalled();
  });

  it('should return persistence failure when repository save fails', async () => {
    repository.upsertActiveContext.mockRejectedValue(new Error('database unavailable'));

    await expect(useCase.execute(reservationContextInputFixture())).resolves.toEqual({
      success: false,
      errorCode: ReservationContextErrorCode.PERSISTENCE_ERROR,
      message: 'database unavailable',
    });
  });

  it('should ignore fields outside the structured context contract before persistence', async () => {
    const input = {
      ...reservationContextInputFixture(),
      fullTranscript: 'Usuario: hola\nBot: hola\nUsuario: quiero reservar',
    } as SaveReservationContextInput & { fullTranscript: string };
    repository.upsertActiveContext.mockResolvedValue(reservationContextEntityFixture());

    await useCase.execute(input);

    const persistedInput = repository.upsertActiveContext.mock.calls[0][0];

    expect(persistedInput).not.toHaveProperty('fullTranscript');
  });
});
