import { MonthlyUsage, Subscription } from '../entities';
import {
  createBillingPeriodServiceMock,
  createBillingUsageRepositoryMock,
} from '../test/mocks/dependency-mocks';
import { BillingPeriodService } from '../service/billing-period.service';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';
import { CheckWhatsappReservationQuotaUseCase } from './check-whatsapp-reservation-quota.use-case';
import { SubscriptionStatus } from 'src/lib';

describe('CheckWhatsappReservationQuotaUseCase', () => {
  const accountId = 'account-1';
  const period = '2026-05';
  const now = new Date('2026-05-18T12:00:00.000Z');

  let billingPeriodServiceMock = createBillingPeriodServiceMock();
  let billingUsageRepositoryMock = createBillingUsageRepositoryMock();
  let useCase: CheckWhatsappReservationQuotaUseCase;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    billingPeriodServiceMock = createBillingPeriodServiceMock();
    billingUsageRepositoryMock = createBillingUsageRepositoryMock();
    billingPeriodServiceMock.getCurrentPeriod.mockReturnValue(period);

    useCase = new CheckWhatsappReservationQuotaUseCase(
      billingPeriodServiceMock as unknown as BillingPeriodService,
      billingUsageRepositoryMock as unknown as BillingUsageRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deberia permitir crear reserva cuando hay suscripcion activa y consumo disponible', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue({
      accountId,
      period,
      whatsappReservationsUsed: 3,
    } as MonthlyUsage);

    await expect(useCase.execute(accountId)).resolves.toEqual({ allowed: true });
    expect(billingUsageRepositoryMock.findActiveSubscription).toHaveBeenCalledWith(accountId, now);
    expect(billingUsageRepositoryMock.findMonthlyUsage).toHaveBeenCalledWith(accountId, period);
  });

  it('deberia bloquear cuando falta suscripcion activa', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(null);

    await expect(useCase.execute(accountId)).resolves.toEqual({
      allowed: false,
      reason: 'missing_active_subscription',
    });
    expect(billingUsageRepositoryMock.findMonthlyUsage).not.toHaveBeenCalled();
  });

  it('deberia bloquear cuando el plan esta inactivo', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ isActive: false }),
    );

    await expect(useCase.execute(accountId)).resolves.toEqual({
      allowed: false,
      reason: 'inactive_plan',
    });
    expect(billingUsageRepositoryMock.findMonthlyUsage).not.toHaveBeenCalled();
  });

  it('deberia bloquear cuando el consumo mensual alcanzo el limite', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 3 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue({
      accountId,
      period,
      whatsappReservationsUsed: 3,
    } as MonthlyUsage);

    await expect(useCase.execute(accountId)).resolves.toEqual({
      allowed: false,
      reason: 'limit_reached',
    });
  });

  function createSubscription(params?: { isActive?: boolean; limit?: number }): Subscription {
    return {
      id: 'subscription-1',
      accountId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date('2026-05-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-06-01T00:00:00.000Z'),
      plan: {
        id: 'plan-1',
        isActive: params?.isActive ?? true,
        monthlyWhatsappReservationLimit: params?.limit ?? 10,
      },
    } as Subscription;
  }
});
