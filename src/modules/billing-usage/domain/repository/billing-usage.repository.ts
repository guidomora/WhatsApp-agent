import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  BillingUsageConsumeQuotaParams,
  BillingUsageConsumeQuotaResult,
  BillingUsageReleaseQuotaParams,
  BillingUsageReleaseQuotaResult,
  SubscriptionStatus,
  UsageEventType,
} from 'src/lib';
import {
  DataSource,
  DeleteResult,
  InsertResult,
  LessThanOrEqual,
  MoreThan,
  Repository,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { MonthlyUsage, Subscription, UsageEvent } from '../../entities';

class PlanLimitReachedError extends Error {
  constructor() {
    super('plan_limit_reached');
  }
}

@Injectable()
export class BillingUsageRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(MonthlyUsage)
    private readonly monthlyUsageRepository: Repository<MonthlyUsage>,
  ) {}

  findActiveSubscription(accountId: string, now: Date): Promise<Subscription | null> {
    return this.findActiveSubscriptionWithRepository(accountId, now, this.subscriptionRepository);
  }

  findMonthlyUsage(accountId: string, period: string): Promise<MonthlyUsage | null> {
    return this.monthlyUsageRepository.findOne({
      where: {
        accountId,
        period,
      },
    });
  }

  async consumeWhatsappReservationQuota(
    params: BillingUsageConsumeQuotaParams,
  ): Promise<BillingUsageConsumeQuotaResult> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const usageEventValues: QueryDeepPartialEntity<UsageEvent> = {
          accountId: params.accountId,
          idempotencyKey: params.idempotencyKey,
          metadata: params.metadata as QueryDeepPartialEntity<UsageEvent['metadata']>,
          occurredAt: params.occurredAt,
          period: params.period,
          quantity: 1,
          eventType: UsageEventType.WHATSAPP_RESERVATION_CREATED,
        };

        const usageEventInsertResult = await entityManager
          .createQueryBuilder(UsageEvent, 'usageEvent')
          .insert()
          .into(UsageEvent)
          .values(usageEventValues)
          .orIgnore()
          .returning('id')
          .execute();

        if (!this.wasInsertApplied(usageEventInsertResult)) {
          return {
            consumed: true,
            alreadyConsumed: true,
          };
        }

        await entityManager
          .createQueryBuilder(MonthlyUsage, 'monthlyUsage')
          .insert()
          .into(MonthlyUsage)
          .values({
            accountId: params.accountId,
            period: params.period,
            whatsappReservationsUsed: 0,
          })
          .orIgnore()
          .execute();

        const incrementResult = await entityManager
          .createQueryBuilder(MonthlyUsage, 'monthlyUsage')
          .update(MonthlyUsage)
          .set({
            whatsappReservationsUsed: () => '"whatsappReservationsUsed" + 1',
            updatedAt: () => 'NOW()',
          })
          .where('"accountId" = :accountId', { accountId: params.accountId })
          .andWhere('"period" = :period', { period: params.period })
          .andWhere('"whatsappReservationsUsed" < :planLimit', {
            planLimit: params.planLimit,
          })
          .returning('id')
          .execute();

        if (!this.wasUpdateApplied(incrementResult)) {
          throw new PlanLimitReachedError();
        }

        return {
          consumed: true,
          alreadyConsumed: false,
        };
      });
    } catch (error) {
      if (error instanceof PlanLimitReachedError) {
        return {
          consumed: false,
          reason: 'limit_reached',
        };
      }

      throw error;
    }
  }

  async releaseWhatsappReservationQuota(
    params: BillingUsageReleaseQuotaParams,
  ): Promise<BillingUsageReleaseQuotaResult> {
    return this.dataSource.transaction(async (entityManager) => {
      const deleteResult = await entityManager
        .createQueryBuilder(UsageEvent, 'usageEvent')
        .delete()
        .from(UsageEvent)
        .where('"accountId" = :accountId', { accountId: params.accountId })
        .andWhere('"idempotencyKey" = :idempotencyKey', {
          idempotencyKey: params.idempotencyKey,
        })
        .andWhere('"eventType" = :eventType', {
          eventType: UsageEventType.WHATSAPP_RESERVATION_CREATED,
        })
        .returning('period')
        .execute();

      if (!this.wasDeleteApplied(deleteResult)) {
        return { released: false };
      }

      const deletedPeriod = this.extractDeletedPeriod(deleteResult);

      if (!deletedPeriod) {
        return { released: false };
      }

      await entityManager
        .createQueryBuilder(MonthlyUsage, 'monthlyUsage')
        .update(MonthlyUsage)
        .set({
          whatsappReservationsUsed: () => 'GREATEST("whatsappReservationsUsed" - 1, 0)',
          updatedAt: () => 'NOW()',
        })
        .where('"accountId" = :accountId', { accountId: params.accountId })
        .andWhere('"period" = :period', { period: deletedPeriod })
        .andWhere('"whatsappReservationsUsed" > 0')
        .execute();

      return { released: true };
    });
  }

  private findActiveSubscriptionWithRepository(
    accountId: string,
    now: Date,
    repository: Pick<Repository<Subscription>, 'findOne'>,
  ): Promise<Subscription | null> {
    return repository.findOne({
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
  }

  private wasInsertApplied(insertResult: InsertResult): boolean {
    if (Array.isArray(insertResult.raw)) {
      return insertResult.raw.length > 0;
    }

    if (this.hasRawRowCount(insertResult.raw)) {
      return insertResult.raw.rowCount > 0;
    }

    if (this.hasRawRows(insertResult.raw)) {
      return insertResult.raw.rows.length > 0;
    }

    return false;
  }

  private wasUpdateApplied(updateResult: UpdateResult): boolean {
    if (typeof updateResult.affected === 'number') {
      return updateResult.affected > 0;
    }

    if (Array.isArray(updateResult.raw)) {
      return updateResult.raw.length > 0;
    }

    if (this.hasRawRowCount(updateResult.raw)) {
      return updateResult.raw.rowCount > 0;
    }

    if (this.hasRawRows(updateResult.raw)) {
      return updateResult.raw.rows.length > 0;
    }

    return false;
  }

  private wasDeleteApplied(deleteResult: DeleteResult): boolean {
    if (typeof deleteResult.affected === 'number') {
      return deleteResult.affected > 0;
    }

    if (Array.isArray(deleteResult.raw)) {
      return deleteResult.raw.length > 0;
    }

    if (this.hasRawRowCount(deleteResult.raw)) {
      return deleteResult.raw.rowCount > 0;
    }

    if (this.hasRawRows(deleteResult.raw)) {
      return deleteResult.raw.rows.length > 0;
    }

    return false;
  }

  private extractDeletedPeriod(deleteResult: DeleteResult): string | null {
    const raw: unknown = deleteResult.raw;

    if (!Array.isArray(raw) || raw.length === 0) {
      return null;
    }

    const firstRow: unknown = raw[0];

    if (!this.hasStringPeriod(firstRow)) {
      return null;
    }

    return firstRow.period;
  }

  private hasRawRowCount(raw: unknown): raw is { rowCount: number } {
    if (typeof raw !== 'object' || raw === null) {
      return false;
    }

    return 'rowCount' in raw && typeof raw.rowCount === 'number';
  }

  private hasRawRows(raw: unknown): raw is { rows: unknown[] } {
    if (typeof raw !== 'object' || raw === null) {
      return false;
    }

    return 'rows' in raw && Array.isArray(raw.rows);
  }

  private hasStringPeriod(value: unknown): value is { period: string } {
    if (typeof value !== 'object' || value === null || !('period' in value)) {
      return false;
    }

    const candidate = value as Record<'period', unknown>;
    return typeof candidate.period === 'string';
  }
}
