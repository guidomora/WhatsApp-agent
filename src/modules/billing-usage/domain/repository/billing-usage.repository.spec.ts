import { MonthlyUsage, Subscription } from '../../entities';
import {
  BillingUsageDataSourceMock,
  createDataSourceMock,
  createMonthlyUsageRepositoryMock,
  createSubscriptionRepositoryMock,
} from '../../test/mocks/dependency-mocks';
import { BillingUsageRepository } from './billing-usage.repository';
import { SubscriptionStatus, UsageEventType } from 'src/lib';
import { LessThanOrEqual, MoreThan } from 'typeorm';

describe('BillingUsageRepository', () => {
  const accountId = 'account-1';
  const period = '2026-05';
  const now = new Date('2026-05-18T12:00:00.000Z');

  let dataSourceMock: BillingUsageDataSourceMock;
  let subscriptionRepositoryMock = createSubscriptionRepositoryMock();
  let monthlyUsageRepositoryMock = createMonthlyUsageRepositoryMock();
  let repository: BillingUsageRepository;

  beforeEach(() => {
    subscriptionRepositoryMock = createSubscriptionRepositoryMock();
    monthlyUsageRepositoryMock = createMonthlyUsageRepositoryMock();
    dataSourceMock = createDataSourceMock({
      subscriptionRepositoryMock,
      usageEventQueryBuilderSequence: ['insert', 'delete'],
      monthlyUsageQueryBuilderSequence: ['initialize', 'increment', 'decrement'],
    });

    repository = new BillingUsageRepository(
      dataSourceMock,
      subscriptionRepositoryMock as never,
      monthlyUsageRepositoryMock as never,
    );
  });

  it('deberia buscar la suscripcion activa mas reciente con plan', async () => {
    const subscription = {
      id: 'subscription-1',
      accountId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date('2026-05-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-06-01T00:00:00.000Z'),
    } as Subscription;
    subscriptionRepositoryMock.findOne.mockResolvedValue(subscription);

    await expect(repository.findActiveSubscription(accountId, now)).resolves.toBe(subscription);

    expect(subscriptionRepositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        accountId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: LessThanOrEqual(now),
        currentPeriodEnd: MoreThan(now),
      },
      relations: {
        plan: true,
      },
      order: {
        currentPeriodStart: 'DESC',
      },
    });
  });

  it('deberia buscar el consumo mensual por cuenta y periodo', async () => {
    const monthlyUsage = {
      id: 'usage-1',
      accountId,
      period,
      whatsappReservationsUsed: 3,
    } as MonthlyUsage;
    monthlyUsageRepositoryMock.findOne.mockResolvedValue(monthlyUsage);

    await expect(repository.findMonthlyUsage(accountId, period)).resolves.toBe(monthlyUsage);

    expect(monthlyUsageRepositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        accountId,
        period,
      },
    });
  });

  it('deberia insertar evento, inicializar uso mensual e incrementar cuota en una transaccion', async () => {
    await expect(
      repository.consumeWhatsappReservationQuota({
        accountId,
        idempotencyKey: 'event-1',
        metadata: { source: 'test' },
        occurredAt: now,
        period,
        planLimit: 10,
      }),
    ).resolves.toEqual({
      consumed: true,
      alreadyConsumed: false,
    });

    expect(dataSourceMock.transaction.mock.calls).toHaveLength(1);
    expect(dataSourceMock.usageEventInsertQueryBuilder.values).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId,
        idempotencyKey: 'event-1',
        metadata: { source: 'test' },
        occurredAt: now,
        period,
        quantity: 1,
        eventType: UsageEventType.WHATSAPP_RESERVATION_CREATED,
      }),
    );
    expect(dataSourceMock.monthlyUsageInitializeInsertQueryBuilder.execute.mock.calls).toHaveLength(
      1,
    );
    expect(dataSourceMock.monthlyUsageIncrementQueryBuilder.execute.mock.calls).toHaveLength(1);
  });

  it('deberia devolver alreadyConsumed cuando el evento idempotente ya existia', async () => {
    dataSourceMock = createDataSourceMock({
      subscriptionRepositoryMock,
      usageEventInsertResult: {
        identifiers: [],
        generatedMaps: [],
        raw: [],
      },
      usageEventQueryBuilderSequence: ['insert'],
    });
    repository = new BillingUsageRepository(
      dataSourceMock,
      subscriptionRepositoryMock as never,
      monthlyUsageRepositoryMock as never,
    );

    await expect(
      repository.consumeWhatsappReservationQuota({
        accountId,
        idempotencyKey: 'event-1',
        occurredAt: now,
        period,
        planLimit: 10,
      }),
    ).resolves.toEqual({
      consumed: true,
      alreadyConsumed: true,
    });

    expect(dataSourceMock.monthlyUsageInitializeInsertQueryBuilder.execute.mock.calls).toHaveLength(
      0,
    );
    expect(dataSourceMock.monthlyUsageIncrementQueryBuilder.execute.mock.calls).toHaveLength(0);
  });

  it('deberia devolver limit_reached cuando el incremento atomico no aplica cambios', async () => {
    dataSourceMock = createDataSourceMock({
      subscriptionRepositoryMock,
      monthlyUsageIncrementResult: {
        generatedMaps: [],
        raw: [],
        affected: 0,
      },
      usageEventQueryBuilderSequence: ['insert'],
      monthlyUsageQueryBuilderSequence: ['initialize', 'increment'],
    });
    repository = new BillingUsageRepository(
      dataSourceMock,
      subscriptionRepositoryMock as never,
      monthlyUsageRepositoryMock as never,
    );

    await expect(
      repository.consumeWhatsappReservationQuota({
        accountId,
        idempotencyKey: 'event-1',
        occurredAt: now,
        period,
        planLimit: 3,
      }),
    ).resolves.toEqual({
      consumed: false,
      reason: 'limit_reached',
    });
  });

  it('deberia liberar cuota solo cuando se elimina un evento con periodo', async () => {
    dataSourceMock = createDataSourceMock({
      subscriptionRepositoryMock,
      usageEventQueryBuilderSequence: ['delete'],
      monthlyUsageQueryBuilderSequence: ['decrement'],
    });
    repository = new BillingUsageRepository(
      dataSourceMock,
      subscriptionRepositoryMock as never,
      monthlyUsageRepositoryMock as never,
    );

    await expect(
      repository.releaseWhatsappReservationQuota({
        accountId,
        idempotencyKey: 'event-1',
      }),
    ).resolves.toEqual({ released: true });

    expect(dataSourceMock.usageEventDeleteQueryBuilder.returning).toHaveBeenCalledWith('period');
    expect(dataSourceMock.monthlyUsageDecrementQueryBuilder.execute.mock.calls).toHaveLength(1);
  });

  it('deberia no decrementar uso mensual cuando no se elimina un evento', async () => {
    dataSourceMock = createDataSourceMock({
      subscriptionRepositoryMock,
      usageEventQueryBuilderSequence: ['delete'],
      monthlyUsageQueryBuilderSequence: ['decrement'],
      usageEventDeleteResult: {
        raw: [],
        affected: 0,
      },
    });
    repository = new BillingUsageRepository(
      dataSourceMock,
      subscriptionRepositoryMock as never,
      monthlyUsageRepositoryMock as never,
    );

    await expect(
      repository.releaseWhatsappReservationQuota({
        accountId,
        idempotencyKey: 'event-1',
      }),
    ).resolves.toEqual({ released: false });

    expect(dataSourceMock.monthlyUsageDecrementQueryBuilder.execute.mock.calls).toHaveLength(0);
  });
});
