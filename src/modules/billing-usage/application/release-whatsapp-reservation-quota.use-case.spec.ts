import { createBillingUsageRepositoryMock } from '../test/mocks/dependency-mocks';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';
import { ReleaseWhatsappReservationQuotaUseCase } from './release-whatsapp-reservation-quota.use-case';

describe('ReleaseWhatsappReservationQuotaUseCase', () => {
  const params = {
    accountId: 'account-1',
    idempotencyKey: 'event-1',
  };

  let billingUsageRepositoryMock = createBillingUsageRepositoryMock();
  let useCase: ReleaseWhatsappReservationQuotaUseCase;

  beforeEach(() => {
    billingUsageRepositoryMock = createBillingUsageRepositoryMock();
    useCase = new ReleaseWhatsappReservationQuotaUseCase(
      billingUsageRepositoryMock as unknown as BillingUsageRepository,
    );
  });

  it('deberia devolver released true cuando el repositorio libera cuota', async () => {
    billingUsageRepositoryMock.releaseWhatsappReservationQuota.mockResolvedValue({
      released: true,
    });

    await expect(useCase.execute(params)).resolves.toEqual({ released: true });
    expect(billingUsageRepositoryMock.releaseWhatsappReservationQuota).toHaveBeenCalledWith(params);
  });

  it('deberia devolver released false cuando no habia evento para compensar', async () => {
    billingUsageRepositoryMock.releaseWhatsappReservationQuota.mockResolvedValue({
      released: false,
    });

    await expect(useCase.execute(params)).resolves.toEqual({ released: false });
  });
});
