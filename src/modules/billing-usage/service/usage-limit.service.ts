import { Injectable } from '@nestjs/common';
import {
  ConsumeWhatsappReservationQuotaParams,
  ConsumeWhatsappReservationQuotaResult,
  ReleaseWhatsappReservationQuotaParams,
  ReleaseWhatsappReservationQuotaResult,
  UsageLimitCheckResult,
} from 'src/lib';
import { CheckWhatsappReservationQuotaUseCase } from '../application/check-whatsapp-reservation-quota.use-case';
import { ConsumeWhatsappReservationQuotaUseCase } from '../application/consume-whatsapp-reservation-quota.use-case';
import { ReleaseWhatsappReservationQuotaUseCase } from '../application/release-whatsapp-reservation-quota.use-case';

@Injectable()
export class UsageLimitService {
  constructor(
    private readonly checkWhatsappReservationQuotaUseCase: CheckWhatsappReservationQuotaUseCase,
    private readonly consumeWhatsappReservationQuotaUseCase: ConsumeWhatsappReservationQuotaUseCase,
    private readonly releaseWhatsappReservationQuotaUseCase: ReleaseWhatsappReservationQuotaUseCase,
  ) {}

  canCreateWhatsappReservation(accountId: string): Promise<UsageLimitCheckResult> {
    return this.checkWhatsappReservationQuotaUseCase.execute(accountId);
  }

  consumeWhatsappReservationQuota(
    params: ConsumeWhatsappReservationQuotaParams,
  ): Promise<ConsumeWhatsappReservationQuotaResult> {
    return this.consumeWhatsappReservationQuotaUseCase.execute(params);
  }

  releaseWhatsappReservationQuota(
    params: ReleaseWhatsappReservationQuotaParams,
  ): Promise<ReleaseWhatsappReservationQuotaResult> {
    return this.releaseWhatsappReservationQuotaUseCase.execute(params);
  }
}
