import { Injectable } from '@nestjs/common';
import {
  WhatsappReservationQuotaState,
  WhatsappReservationQuotaSummary,
  WhatsappReservationQuotaUnavailableReason,
} from 'src/lib';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';
import { Subscription } from '../entities';
import { BillingPeriodService } from '../service/billing-period.service';

const NEAR_LIMIT_RATIO = 0.2;

@Injectable()
export class GetWhatsappReservationQuotaSummaryUseCase {
  constructor(
    private readonly billingPeriodService: BillingPeriodService,
    private readonly billingUsageRepository: BillingUsageRepository,
  ) {}

  async execute(accountId: string): Promise<WhatsappReservationQuotaSummary> {
    const now = new Date();
    const period = this.billingPeriodService.getCurrentPeriod(now);
    const subscription = await this.billingUsageRepository.findActiveSubscription(accountId, now);

    if (!subscription?.plan) {
      return this.createUnavailableSummary(accountId, period, 'missing_active_subscription');
    }

    if (subscription.plan.isActive !== true) {
      return this.createUnavailableSummary(accountId, period, 'inactive_plan');
    }

    const planLimit = subscription.plan.monthlyWhatsappReservationLimit;

    if (planLimit === null) {
      return this.createUnlimitedSummary(accountId, period, subscription);
    }

    if (!Number.isFinite(planLimit) || planLimit < 0) {
      return this.createUnavailableSummary(accountId, period, 'invalid_plan_limit');
    }

    const monthlyUsage = await this.billingUsageRepository.findMonthlyUsage(accountId, period);
    const usedReservations = monthlyUsage?.whatsappReservationsUsed ?? 0;
    const remaining = Math.max(planLimit - usedReservations, 0);
    const overage = Math.max(usedReservations - planLimit, 0);

    return {
      accountId,
      period,
      periodStart: subscription.currentPeriodStart.toISOString(),
      periodEnd: subscription.currentPeriodEnd.toISOString(),
      plan: {
        id: subscription.plan.id,
        code: subscription.plan.code,
        name: subscription.plan.name,
        monthlyWhatsappReservationLimit: planLimit,
      },
      used: usedReservations,
      remaining,
      overage,
      state: this.resolveQuotaState(planLimit, remaining),
    };
  }

  private resolveQuotaState(
    planLimit: number,
    remaining: number,
  ): Exclude<WhatsappReservationQuotaState, WhatsappReservationQuotaState.UNAVAILABLE> {
    if (remaining === 0) {
      return WhatsappReservationQuotaState.EXHAUSTED;
    }

    if (remaining <= Math.ceil(planLimit * NEAR_LIMIT_RATIO)) {
      return WhatsappReservationQuotaState.NEAR_LIMIT;
    }

    return WhatsappReservationQuotaState.AVAILABLE;
  }

  private async createUnlimitedSummary(
    accountId: string,
    period: string,
    subscription: Subscription,
  ): Promise<WhatsappReservationQuotaSummary> {
    const monthlyUsage = await this.billingUsageRepository.findMonthlyUsage(accountId, period);

    return {
      accountId,
      period,
      periodStart: subscription.currentPeriodStart.toISOString(),
      periodEnd: subscription.currentPeriodEnd.toISOString(),
      plan: {
        id: subscription.plan?.id ?? '',
        code: subscription.plan?.code ?? '',
        name: subscription.plan?.name ?? '',
        monthlyWhatsappReservationLimit: null,
      },
      used: monthlyUsage?.whatsappReservationsUsed ?? 0,
      remaining: 0,
      overage: 0,
      state: WhatsappReservationQuotaState.UNLIMITED,
    };
  }

  private createUnavailableSummary(
    accountId: string,
    period: string,
    unavailableReason: WhatsappReservationQuotaUnavailableReason,
  ): WhatsappReservationQuotaSummary {
    return {
      accountId,
      period,
      periodStart: null,
      periodEnd: null,
      plan: null,
      used: 0,
      remaining: 0,
      overage: 0,
      state: WhatsappReservationQuotaState.UNAVAILABLE,
      unavailableReason,
    };
  }
}
