import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account, MonthlyUsage, Plan, Subscription, UsageEvent } from './entities';
import { CheckWhatsappReservationQuotaUseCase } from './application/check-whatsapp-reservation-quota.use-case';
import { ConsumeWhatsappReservationQuotaUseCase } from './application/consume-whatsapp-reservation-quota.use-case';
import { GetWhatsappReservationQuotaSummaryUseCase } from './application/get-whatsapp-reservation-quota-summary.use-case';
import { ReleaseWhatsappReservationQuotaUseCase } from './application/release-whatsapp-reservation-quota.use-case';
import { BillingUsageController } from './controller/billing-usage.controller';
import { BillingUsageRepository } from './domain/repository/billing-usage.repository';
import { BillingPeriodService } from './service/billing-period.service';
import { UsageLimitService } from './service/usage-limit.service';
import { InternalApiTokenGuard } from 'src/common/guards/internal-api-token.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Plan, Subscription, UsageEvent, MonthlyUsage])],
  controllers: [BillingUsageController],
  providers: [
    BillingPeriodService,
    BillingUsageRepository,
    CheckWhatsappReservationQuotaUseCase,
    ConsumeWhatsappReservationQuotaUseCase,
    GetWhatsappReservationQuotaSummaryUseCase,
    InternalApiTokenGuard,
    ReleaseWhatsappReservationQuotaUseCase,
    UsageLimitService,
  ],
  exports: [UsageLimitService],
})
export class BillingUsageModule {}
