import { Injectable } from '@nestjs/common';
import {
  ReleaseWhatsappReservationQuotaParams,
  ReleaseWhatsappReservationQuotaResult,
} from 'src/lib';
import { BillingUsageRepository } from '../domain/repository/billing-usage.repository';

@Injectable()
export class ReleaseWhatsappReservationQuotaUseCase {
  constructor(private readonly billingUsageRepository: BillingUsageRepository) {}

  execute(
    params: ReleaseWhatsappReservationQuotaParams,
  ): Promise<ReleaseWhatsappReservationQuotaResult> {
    return this.billingUsageRepository.releaseWhatsappReservationQuota(params);
  }
}
