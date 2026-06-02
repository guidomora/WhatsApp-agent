import { Subscription } from '../entities';
import {
  createBillingPeriodServiceMock,
  createBillingUsageRepositoryMock,
} from '../test/mocks/dependency-mocks';
import { BillingPeriodService } from '../service/billing-period.service';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';
import { ConsumeWhatsappReservationQuotaUseCase } from './consume-whatsapp-reservation-quota.use-case';
import { SubscriptionStatus } from 'src/lib';

describe('ConsumeWhatsappReservationQuotaUseCase', () => {
  const accountId = 'account-1';
  const period = '2026-05';
  const now = new Date('2026-05-18T12:00:00.000Z');
  const params = {
    accountId,
    idempotencyKey: 'event-1',
    metadata: { source: 'test' },
  };

  let billingPeriodServiceMock = createBillingPeriodServiceMock();
  let billingUsageRepositoryMock = createBillingUsageRepositoryMock();
  let useCase: ConsumeWhatsappReservationQuotaUseCase;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    billingPeriodServiceMock = createBillingPeriodServiceMock();
    billingUsageRepositoryMock = createBillingUsageRepositoryMock();
    billingPeriodServiceMock.getCurrentPeriod.mockReturnValue(period);

    useCase = new ConsumeWhatsappReservationQuotaUseCase(
      billingPeriodServiceMock as unknown as BillingPeriodService,
      billingUsageRepositoryMock as unknown as BillingUsageRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deberia consumir cuota cuando hay suscripcion activa y capacidad disponible', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.consumeWhatsappReservationQuota.mockResolvedValue({
      consumed: true,
      alreadyConsumed: false,
    });

    await expect(useCase.execute(params)).resolves.toEqual({
      allowed: true,
      alreadyConsumed: false,
    });
    expect(billingUsageRepositoryMock.consumeWhatsappReservationQuota).toHaveBeenCalledWith({
      accountId,
      idempotencyKey: 'event-1',
      metadata: { source: 'test' },
      occurredAt: now,
      period,
      planLimit: 10,
    });
  });

  it('deberia devolver allowed true idempotente cuando el evento ya fue consumido', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.consumeWhatsappReservationQuota.mockResolvedValue({
      consumed: true,
      alreadyConsumed: true,
    });

    await expect(useCase.execute(params)).resolves.toEqual({
      allowed: true,
      alreadyConsumed: true,
    });
  });

  it('deberia bloquear cuando falta suscripcion activa', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(null);

    await expect(useCase.execute(params)).resolves.toEqual({
      allowed: false,
      reason: 'missing_active_subscription',
    });
    expect(billingUsageRepositoryMock.consumeWhatsappReservationQuota).not.toHaveBeenCalled();
  });

  it('deberia bloquear cuando el plan esta inactivo', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ isActive: false }),
    );

    await expect(useCase.execute(params)).resolves.toEqual({
      allowed: false,
      reason: 'inactive_plan',
    });
    expect(billingUsageRepositoryMock.consumeWhatsappReservationQuota).not.toHaveBeenCalled();
  });

  it('deberia bloquear cuando el repositorio informa limite alcanzado', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 3 }),
    );
    billingUsageRepositoryMock.consumeWhatsappReservationQuota.mockResolvedValue({
      consumed: false,
      reason: 'limit_reached',
    });

    await expect(useCase.execute(params)).resolves.toEqual({
      allowed: false,
      reason: 'limit_reached',
    });
  });

  it('deberia mantenerse aislado de detalles de query builder de TypeORM', () => {
    expect(billingUsageRepositoryMock).not.toHaveProperty('usageEventInsertQueryBuilder');
    expect(billingUsageRepositoryMock).not.toHaveProperty('monthlyUsageIncrementQueryBuilder');
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
