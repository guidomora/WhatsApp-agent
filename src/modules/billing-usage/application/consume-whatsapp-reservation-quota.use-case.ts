import { Injectable } from '@nestjs/common';
import {
  ConsumeWhatsappReservationQuotaParams,
  ConsumeWhatsappReservationQuotaResult,
} from 'src/lib';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';
import { BillingPeriodService } from '../service/billing-period.service';

@Injectable()
export class ConsumeWhatsappReservationQuotaUseCase {
  constructor(
    private readonly billingPeriodService: BillingPeriodService,
    private readonly billingUsageRepository: BillingUsageRepository,
  ) {}

  async execute(
    params: ConsumeWhatsappReservationQuotaParams,
  ): Promise<ConsumeWhatsappReservationQuotaResult> {
    const now = new Date();
    const period = this.billingPeriodService.getCurrentPeriod(now);
    const subscription = await this.billingUsageRepository.findActiveSubscription(
      params.accountId,
      now,
    );

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

    const consumeResult = await this.billingUsageRepository.consumeWhatsappReservationQuota({
      accountId: params.accountId,
      idempotencyKey: params.idempotencyKey,
      metadata: params.metadata,
      occurredAt: now,
      period,
      planLimit: subscription.plan.monthlyWhatsappReservationLimit,
    });

    if (!consumeResult.consumed) {
      return {
        allowed: false,
        reason: consumeResult.reason,
      };
    }

    return {
      allowed: true,
      alreadyConsumed: consumeResult.alreadyConsumed,
    };
  }
}
