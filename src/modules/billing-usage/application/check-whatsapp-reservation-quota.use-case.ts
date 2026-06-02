import { Injectable } from '@nestjs/common';
import { UsageLimitCheckResult } from 'src/lib';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';
import { BillingPeriodService } from '../service/billing-period.service';

@Injectable()
export class CheckWhatsappReservationQuotaUseCase {
  constructor(
    private readonly billingPeriodService: BillingPeriodService,
    private readonly billingUsageRepository: BillingUsageRepository,
  ) {}

  async execute(accountId: string): Promise<UsageLimitCheckResult> {
    const now = new Date();
    const currentPeriod = this.billingPeriodService.getCurrentPeriod(now);
    const subscription = await this.billingUsageRepository.findActiveSubscription(accountId, now);

    if (!subscription?.plan) {
      return {
        allowed: false,
        reason: 'missing_active_subscription',
      };
    }

    if (subscription.plan.isActive !== true) {
      return {
        allowed: false,
        reason: 'inactive_plan',
      };
    }

    const monthlyUsage = await this.billingUsageRepository.findMonthlyUsage(
      accountId,
      currentPeriod,
    );
    const usedReservations = monthlyUsage?.whatsappReservationsUsed ?? 0;

    if (usedReservations >= subscription.plan.monthlyWhatsappReservationLimit) {
      return {
        allowed: false,
        reason: 'limit_reached',
      };
    }

    return { allowed: true };
  }
}
