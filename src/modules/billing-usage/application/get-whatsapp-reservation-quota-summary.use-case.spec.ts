import { MonthlyUsage, Subscription } from '../entities';
import {
  createBillingPeriodServiceMock,
  createBillingUsageRepositoryMock,
} from '../test/mocks/dependency-mocks';
import { BillingPeriodService } from '../service/billing-period.service';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';
import {
  SubscriptionStatus,
  WhatsappReservationQuotaState,
  WhatsappReservationQuotaSummary,
} from 'src/lib';
import { GetWhatsappReservationQuotaSummaryUseCase } from './get-whatsapp-reservation-quota-summary.use-case';

describe('GetWhatsappReservationQuotaSummaryUseCase', () => {
  const accountId = 'account-1';
  const period = '2026-05';
  const now = new Date('2026-05-18T12:00:00.000Z');
  const periodBounds = {
    start: new Date('2026-05-01T00:00:00.000Z'),
    end: new Date('2026-06-01T00:00:00.000Z'),
  };

  let billingPeriodServiceMock = createBillingPeriodServiceMock();
  let billingUsageRepositoryMock = createBillingUsageRepositoryMock();
  let useCase: GetWhatsappReservationQuotaSummaryUseCase;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    billingPeriodServiceMock = createBillingPeriodServiceMock();
    billingUsageRepositoryMock = createBillingUsageRepositoryMock();
    billingPeriodServiceMock.getCurrentPeriod.mockReturnValue(period);
    billingPeriodServiceMock.getPeriodBounds.mockReturnValue(periodBounds);

    useCase = new GetWhatsappReservationQuotaSummaryUseCase(
      billingPeriodServiceMock as unknown as BillingPeriodService,
      billingUsageRepositoryMock as unknown as BillingUsageRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deberia devolver limite, consumo y restante para un plan activo con cupo disponible', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(createMonthlyUsage({ used: 3 }));

    await expect(useCase.execute(accountId)).resolves.toEqual(
      createExpectedSummary({
        used: 3,
        remaining: 7,
        state: WhatsappReservationQuotaState.AVAILABLE,
      }),
    );
    expect(billingUsageRepositoryMock.findActiveSubscription).toHaveBeenCalledWith(accountId, now);
    expect(billingUsageRepositoryMock.findMonthlyUsage).toHaveBeenCalledWith(accountId, period);
  });

  it('deberia tratar consumo mensual faltante como cero', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(null);

    await expect(useCase.execute(accountId)).resolves.toEqual(
      createExpectedSummary({
        used: 0,
        remaining: 10,
        state: WhatsappReservationQuotaState.AVAILABLE,
      }),
    );
  });

  it('deberia marcar near_limit cuando el restante esta dentro del umbral backend', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(createMonthlyUsage({ used: 8 }));

    await expect(useCase.execute(accountId)).resolves.toEqual(
      createExpectedSummary({
        used: 8,
        remaining: 2,
        state: WhatsappReservationQuotaState.NEAR_LIMIT,
      }),
    );
  });

  it('deberia marcar exhausted cuando el consumo alcanza el limite', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(createMonthlyUsage({ used: 10 }));

    await expect(useCase.execute(accountId)).resolves.toEqual(
      createExpectedSummary({
        used: 10,
        remaining: 0,
        state: WhatsappReservationQuotaState.EXHAUSTED,
      }),
    );
  });

  it('deberia devolver remaining cero y overage cuando el consumo supera el limite', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 10 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(createMonthlyUsage({ used: 13 }));

    await expect(useCase.execute(accountId)).resolves.toEqual(
      createExpectedSummary({
        used: 13,
        remaining: 0,
        overage: 3,
        state: WhatsappReservationQuotaState.EXHAUSTED,
      }),
    );
  });

  it('deberia devolver unavailable cuando falta suscripcion activa', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(null);

    await expect(useCase.execute(accountId)).resolves.toEqual({
      accountId,
      period,
      periodStart: null,
      periodEnd: null,
      plan: null,
      used: 0,
      remaining: 0,
      overage: 0,
      state: WhatsappReservationQuotaState.UNAVAILABLE,
      unavailableReason: 'missing_active_subscription',
    });
    expect(billingUsageRepositoryMock.findMonthlyUsage).not.toHaveBeenCalled();
  });

  it('deberia devolver unavailable cuando el plan esta inactivo', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ isActive: false }),
    );

    await expect(useCase.execute(accountId)).resolves.toEqual({
      accountId,
      period,
      periodStart: null,
      periodEnd: null,
      plan: null,
      used: 0,
      remaining: 0,
      overage: 0,
      state: WhatsappReservationQuotaState.UNAVAILABLE,
      unavailableReason: 'inactive_plan',
    });
    expect(billingUsageRepositoryMock.findMonthlyUsage).not.toHaveBeenCalled();
  });

  it('deberia devolver unavailable cuando el limite del plan es invalido', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: -1 }),
    );

    await expect(useCase.execute(accountId)).resolves.toEqual({
      accountId,
      period,
      periodStart: null,
      periodEnd: null,
      plan: null,
      used: 0,
      remaining: 0,
      overage: 0,
      state: WhatsappReservationQuotaState.UNAVAILABLE,
      unavailableReason: 'invalid_plan_limit',
    });
  });

  it('deberia representar planes ilimitados si el dato de plan lo permite', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: null }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(createMonthlyUsage({ used: 12 }));

    await expect(useCase.execute(accountId)).resolves.toEqual({
      accountId,
      period,
      periodStart: periodBounds.start.toISOString(),
      periodEnd: periodBounds.end.toISOString(),
      plan: {
        id: 'plan-1',
        code: 'basic',
        name: 'Basic',
        monthlyWhatsappReservationLimit: null,
      },
      used: 12,
      remaining: 0,
      overage: 0,
      state: WhatsappReservationQuotaState.UNLIMITED,
    });
  });

  it('deberia mantenerse consistente con la validacion de enforcement cuando queda cupo', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 5 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(createMonthlyUsage({ used: 4 }));

    const result = await useCase.execute(accountId);

    expect(result.remaining).toBeGreaterThan(0);
    expect(result.state).toBe(WhatsappReservationQuotaState.NEAR_LIMIT);
  });

  it('deberia mantenerse consistente con la validacion de enforcement cuando se agoto el cupo', async () => {
    billingUsageRepositoryMock.findActiveSubscription.mockResolvedValue(
      createSubscription({ limit: 5 }),
    );
    billingUsageRepositoryMock.findMonthlyUsage.mockResolvedValue(createMonthlyUsage({ used: 5 }));

    const result = await useCase.execute(accountId);

    expect(result.remaining).toBe(0);
    expect(result.state).toBe(WhatsappReservationQuotaState.EXHAUSTED);
  });

  function createSubscription(params?: {
    isActive?: boolean;
    limit?: number | null;
  }): Subscription {
    return {
      id: 'subscription-1',
      accountId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date('2026-05-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-06-01T00:00:00.000Z'),
      plan: {
        id: 'plan-1',
        code: 'basic',
        name: 'Basic',
        isActive: params?.isActive ?? true,
        monthlyWhatsappReservationLimit: params && 'limit' in params ? params.limit : 10,
      },
    } as Subscription;
  }

  function createMonthlyUsage(params: { used: number }): MonthlyUsage {
    return {
      accountId,
      period,
      whatsappReservationsUsed: params.used,
    } as MonthlyUsage;
  }

  function createExpectedSummary(
    params: Pick<WhatsappReservationQuotaSummary, 'used' | 'remaining' | 'state'> & {
      overage?: number;
    },
  ): WhatsappReservationQuotaSummary {
    return {
      accountId,
      period,
      periodStart: periodBounds.start.toISOString(),
      periodEnd: periodBounds.end.toISOString(),
      plan: {
        id: 'plan-1',
        code: 'basic',
        name: 'Basic',
        monthlyWhatsappReservationLimit: 10,
      },
      used: params.used,
      remaining: params.remaining,
      overage: params.overage ?? 0,
      state: params.state,
    };
  }
});
