import { CheckWhatsappReservationQuotaUseCase } from '../application/check-whatsapp-reservation-quota.use-case';
import { ConsumeWhatsappReservationQuotaUseCase } from '../application/consume-whatsapp-reservation-quota.use-case';
import { ReleaseWhatsappReservationQuotaUseCase } from '../application/release-whatsapp-reservation-quota.use-case';
import { UsageLimitService } from './usage-limit.service';

describe('UsageLimitService', () => {
  const accountId = 'account-1';
  const consumeParams = {
    accountId,
    idempotencyKey: 'event-1',
    metadata: { source: 'test' },
  };
  const releaseParams = {
    accountId,
    idempotencyKey: 'event-1',
  };

  let checkWhatsappReservationQuotaUseCaseMock: jest.Mocked<
    Pick<CheckWhatsappReservationQuotaUseCase, 'execute'>
  >;
  let consumeWhatsappReservationQuotaUseCaseMock: jest.Mocked<
    Pick<ConsumeWhatsappReservationQuotaUseCase, 'execute'>
  >;
  let releaseWhatsappReservationQuotaUseCaseMock: jest.Mocked<
    Pick<ReleaseWhatsappReservationQuotaUseCase, 'execute'>
  >;
  let service: UsageLimitService;

  beforeEach(() => {
    checkWhatsappReservationQuotaUseCaseMock = {
      execute: jest.fn(),
    };
    consumeWhatsappReservationQuotaUseCaseMock = {
      execute: jest.fn(),
    };
    releaseWhatsappReservationQuotaUseCaseMock = {
      execute: jest.fn(),
    };

    service = new UsageLimitService(
      checkWhatsappReservationQuotaUseCaseMock as unknown as CheckWhatsappReservationQuotaUseCase,
      consumeWhatsappReservationQuotaUseCaseMock as unknown as ConsumeWhatsappReservationQuotaUseCase,
      releaseWhatsappReservationQuotaUseCaseMock as unknown as ReleaseWhatsappReservationQuotaUseCase,
    );
  });

  it('deberia delegar canCreateWhatsappReservation al use-case de check', async () => {
    checkWhatsappReservationQuotaUseCaseMock.execute.mockResolvedValue({ allowed: true });

    await expect(service.canCreateWhatsappReservation(accountId)).resolves.toEqual({
      allowed: true,
    });

    expect(checkWhatsappReservationQuotaUseCaseMock.execute).toHaveBeenCalledTimes(1);
    expect(checkWhatsappReservationQuotaUseCaseMock.execute).toHaveBeenCalledWith(accountId);
    expect(consumeWhatsappReservationQuotaUseCaseMock.execute).not.toHaveBeenCalled();
    expect(releaseWhatsappReservationQuotaUseCaseMock.execute).not.toHaveBeenCalled();
  });

  it('deberia preservar el resultado bloqueado de canCreateWhatsappReservation', async () => {
    checkWhatsappReservationQuotaUseCaseMock.execute.mockResolvedValue({
      allowed: false,
      reason: 'limit_reached',
    });

    await expect(service.canCreateWhatsappReservation(accountId)).resolves.toEqual({
      allowed: false,
      reason: 'limit_reached',
    });
  });

  it('deberia delegar consumeWhatsappReservationQuota al use-case de consume', async () => {
    consumeWhatsappReservationQuotaUseCaseMock.execute.mockResolvedValue({
      allowed: true,
      alreadyConsumed: false,
    });

    await expect(service.consumeWhatsappReservationQuota(consumeParams)).resolves.toEqual({
      allowed: true,
      alreadyConsumed: false,
    });

    expect(consumeWhatsappReservationQuotaUseCaseMock.execute).toHaveBeenCalledTimes(1);
    expect(consumeWhatsappReservationQuotaUseCaseMock.execute).toHaveBeenCalledWith(consumeParams);
    expect(checkWhatsappReservationQuotaUseCaseMock.execute).not.toHaveBeenCalled();
    expect(releaseWhatsappReservationQuotaUseCaseMock.execute).not.toHaveBeenCalled();
  });

  it('deberia preservar el resultado idempotente de consumeWhatsappReservationQuota', async () => {
    consumeWhatsappReservationQuotaUseCaseMock.execute.mockResolvedValue({
      allowed: true,
      alreadyConsumed: true,
    });

    await expect(service.consumeWhatsappReservationQuota(consumeParams)).resolves.toEqual({
      allowed: true,
      alreadyConsumed: true,
    });
  });

  it('deberia preservar el resultado bloqueado de consumeWhatsappReservationQuota', async () => {
    consumeWhatsappReservationQuotaUseCaseMock.execute.mockResolvedValue({
      allowed: false,
      reason: 'inactive_plan',
    });

    await expect(service.consumeWhatsappReservationQuota(consumeParams)).resolves.toEqual({
      allowed: false,
      reason: 'inactive_plan',
    });
  });

  it('deberia delegar releaseWhatsappReservationQuota al use-case de release', async () => {
    releaseWhatsappReservationQuotaUseCaseMock.execute.mockResolvedValue({
      released: true,
    });

    await expect(service.releaseWhatsappReservationQuota(releaseParams)).resolves.toEqual({
      released: true,
    });

    expect(releaseWhatsappReservationQuotaUseCaseMock.execute).toHaveBeenCalledTimes(1);
    expect(releaseWhatsappReservationQuotaUseCaseMock.execute).toHaveBeenCalledWith(releaseParams);
    expect(checkWhatsappReservationQuotaUseCaseMock.execute).not.toHaveBeenCalled();
    expect(consumeWhatsappReservationQuotaUseCaseMock.execute).not.toHaveBeenCalled();
  });

  it('deberia preservar el resultado no liberado de releaseWhatsappReservationQuota', async () => {
    releaseWhatsappReservationQuotaUseCaseMock.execute.mockResolvedValue({
      released: false,
    });

    await expect(service.releaseWhatsappReservationQuota(releaseParams)).resolves.toEqual({
      released: false,
    });
  });
});
