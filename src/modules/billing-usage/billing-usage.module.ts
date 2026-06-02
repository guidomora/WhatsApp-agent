import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account, MonthlyUsage, Plan, Subscription, UsageEvent } from './entities';
import { CheckWhatsappReservationQuotaUseCase } from './application/check-whatsapp-reservation-quota.use-case';
import { ConsumeWhatsappReservationQuotaUseCase } from './application/consume-whatsapp-reservation-quota.use-case';
import { ReleaseWhatsappReservationQuotaUseCase } from './application/release-whatsapp-reservation-quota.use-case';
import { BillingUsageRepository } from './domain/repository/billing-usage.repository';
import { BillingPeriodService } from './service/billing-period.service';
import { UsageLimitService } from './service/usage-limit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Plan, Subscription, UsageEvent, MonthlyUsage])],
  providers: [
    BillingPeriodService,
    BillingUsageRepository,
    CheckWhatsappReservationQuotaUseCase,
    ConsumeWhatsappReservationQuotaUseCase,
    ReleaseWhatsappReservationQuotaUseCase,
    UsageLimitService,
  ],
  exports: [UsageLimitService],
})
export class BillingUsageModule {}
