import { CacheTypeEnum, Intention, RoleEnum } from 'src/lib';
import {
  cancelStateMock,
  createAiServiceMock,
  createCacheServiceMock,
  createDeleteReservationQueueServiceMock,
  createDatesServiceMock,
  simplifiedPayloadMock,
} from '../../test/mocks/dependency-mocks';
import { DeleteReservationStrategy } from './delete-reservation.strategy';

type DatesServiceFlexibleLookupMock = ReturnType<typeof createDatesServiceMock> & {
  findReservationByDateAndPhone: jest.Mock;
};

describe('DeleteReservationStrategy', () => {
  let strategy: DeleteReservationStrategy;
  let datesServiceMock = createDatesServiceMock();
  let deleteReservationQueueServiceMock = createDeleteReservationQueueServiceMock();
  let aiServiceMock = createAiServiceMock();
  let cacheServiceMock = createCacheServiceMock();

  beforeEach(() => {
    jest.clearAllMocks();
    datesServiceMock = createDatesServiceMock();
    deleteReservationQueueServiceMock = createDeleteReservationQueueServiceMock();
    aiServiceMock = createAiServiceMock();
    cacheServiceMock = createCacheServiceMock();
    strategy = new DeleteReservationStrategy(
      datesServiceMock,
      deleteReservationQueueServiceMock,
      aiServiceMock,
      cacheServiceMock,
    );
  });

  it('should ask for missing cancel data when state is incomplete', async () => {
    cacheServiceMock.updateCancelState.mockResolvedValue({
      ...cancelStateMock,
      date: null,
    });
    cacheServiceMock.getHistory.mockResolvedValue([]);
    aiServiceMock.getMissingDataToCancel.mockResolvedValue('Decime el dia');

    await expect(
      strategy.execute({ intent: Intention.CANCEL, name: 'guido' }, simplifiedPayloadMock),
    ).resolves.toEqual({
      reply: 'Decime el dia',
    });

    expect(aiServiceMock.getMissingDataToCancel.mock.calls[0]).toEqual([
      ['date'],
      [],
      { ...cancelStateMock, date: null },
    ]);
    expect(cacheServiceMock.appendEntityMessage.mock.calls[0]).toEqual([
      simplifiedPayloadMock.waId,
      'Decime el dia',
      RoleEnum.ASSISTANT,
      Intention.CANCEL,
    ]);
  });

  it('should resolve reservation by phone and date without requiring name', async () => {
    const resolvedReservation = {
      date: cancelStateMock.date!,
      time: cancelStateMock.time!,
      name: 'guido morbito',
      phone: cancelStateMock.phone!,
      service: 'cena',
      quantity: 2,
    };
    cacheServiceMock.updateCancelState.mockResolvedValue({
      ...cancelStateMock,
      time: null,
      name: null,
    });
    (
      datesServiceMock as DatesServiceFlexibleLookupMock
    ).findReservationByDateAndPhone.mockResolvedValue(resolvedReservation);
    deleteReservationQueueServiceMock.deleteReservation.mockResolvedValue('Reserva cancelada');
    cacheServiceMock.getHistory.mockResolvedValue([]);
    aiServiceMock.cancelReservationResult.mockResolvedValue('Listo, la cancelamos');

    await expect(
      strategy.execute({ intent: Intention.CANCEL, useCurrentPhone: true }, simplifiedPayloadMock),
    ).resolves.toEqual({
      reply: 'Listo, la cancelamos',
    });

    expect(deleteReservationQueueServiceMock.deleteReservation.mock.calls[0]).toEqual([
      {
        phone: cancelStateMock.phone,
        date: resolvedReservation.date,
        time: resolvedReservation.time,
        name: resolvedReservation.name,
      },
    ]);
  });

  it('should ask for time when phone and date lookup is ambiguous', async () => {
    cacheServiceMock.updateCancelState.mockResolvedValue({
      ...cancelStateMock,
      time: null,
      name: null,
    });
    (
      datesServiceMock as DatesServiceFlexibleLookupMock
    ).findReservationByDateAndPhone.mockResolvedValue('ambiguous');
    cacheServiceMock.getHistory.mockResolvedValue([]);
    aiServiceMock.getMissingDataToCancel.mockResolvedValue('Decime el horario');

    await expect(
      strategy.execute({ intent: Intention.CANCEL, useCurrentPhone: true }, simplifiedPayloadMock),
    ).resolves.toEqual({
      reply: 'Decime el horario',
    });

    expect(aiServiceMock.getMissingDataToCancel.mock.calls[0]).toEqual([
      ['time'],
      [],
      {
        ...cancelStateMock,
        time: null,
        name: null,
      },
    ]);
    expect(deleteReservationQueueServiceMock.deleteReservation.mock.calls).toHaveLength(0);
  });

  it('should use the current WhatsApp number when AI marks useCurrentPhone', async () => {
    cacheServiceMock.updateCancelState.mockResolvedValue(cancelStateMock);
    deleteReservationQueueServiceMock.deleteReservation.mockResolvedValue('Reserva cancelada');
    cacheServiceMock.getHistory.mockResolvedValue([]);
    aiServiceMock.cancelReservationResult.mockResolvedValue('Listo, la cancelamos');

    await strategy.execute(
      { intent: Intention.CANCEL, useCurrentPhone: true },
      simplifiedPayloadMock,
    );

    expect(cacheServiceMock.updateCancelState.mock.calls[0]).toEqual([
      simplifiedPayloadMock.waId,
      {
        phone: simplifiedPayloadMock.waId,
        date: null,
        time: null,
        name: null,
      },
    ]);
  });

  it('should delete reservation, clear cancel cache and mark flow completed', async () => {
    cacheServiceMock.updateCancelState.mockResolvedValue(cancelStateMock);
    deleteReservationQueueServiceMock.deleteReservation.mockResolvedValue('Reserva cancelada');
    cacheServiceMock.getHistory.mockResolvedValue([]);
    aiServiceMock.cancelReservationResult.mockResolvedValue('Listo, la cancelamos');

    await expect(
      strategy.execute({ intent: Intention.CANCEL, name: 'guido' }, simplifiedPayloadMock),
    ).resolves.toEqual({
      reply: 'Listo, la cancelamos',
    });

    expect(deleteReservationQueueServiceMock.deleteReservation.mock.calls[0]).toEqual([
      cancelStateMock,
    ]);
    expect(cacheServiceMock.clearHistory.mock.calls[0]).toEqual([
      simplifiedPayloadMock.waId,
      CacheTypeEnum.CANCEL,
    ]);
    expect(cacheServiceMock.markFlowCompleted.mock.calls[0]).toEqual([simplifiedPayloadMock.waId]);
  });
});
