import { Injectable, Logger } from '@nestjs/common';
import {
  CacheTypeEnum,
  Intention,
  MultipleMessagesResponse,
  RoleEnum,
  SimplifiedTwilioWebhookPayload,
} from 'src/lib';
import { AiService } from 'src/modules/ai/service/ai.service';
import { DatesService } from 'src/modules/dates/service/dates.service';
import { CacheService } from 'src/modules/cache-context/cache.service';
import { IntentionStrategyInterface, StrategyResult } from './intention-strategy.interface';
import { getMissingFields } from '../helpers/get-missing-fields.helper';
import { DeleteReservationQueueService } from 'src/modules/reservation-jobs/service/delete-reservation-queue.service';

@Injectable()
export class DeleteReservationStrategy implements IntentionStrategyInterface {
  readonly intent = Intention.CANCEL;
  private readonly logger = new Logger(DeleteReservationStrategy.name);
  constructor(
    private readonly datesService: DatesService,
    private readonly deleteReservationQueueService: DeleteReservationQueueService,
    private readonly aiService: AiService,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    aiResponse: MultipleMessagesResponse,
    simplifiedPayload: SimplifiedTwilioWebhookPayload,
  ): Promise<StrategyResult> {
    const waId = simplifiedPayload.waId;
    const resolvedPhone =
      aiResponse.phone ?? (aiResponse.useCurrentPhone ? simplifiedPayload.waId : null);

    const state = await this.cacheService.updateCancelState(waId, {
      phone: resolvedPhone,
      date: aiResponse.date ?? null,
      time: aiResponse.time ?? null,
      name: aiResponse.name ?? null,
    });
    const missingFields = getMissingFields(state);

    if (missingFields.length > 0) {
      const history = await this.cacheService.getHistory(waId);
      const response = await this.aiService.getMissingDataToCancel(missingFields, history, state);
      await this.cacheService.appendEntityMessage(
        waId,
        response,
        RoleEnum.ASSISTANT,
        Intention.CANCEL,
      );
      return { reply: response };
    }

    const resolvedReservation = await this.datesService.findReservationByDateAndPhone(
      state.date!,
      state.phone!,
      state.time,
    );

    if (resolvedReservation === 'ambiguous') {
      const history = await this.cacheService.getHistory(waId);
      const response = await this.aiService.getMissingDataToCancel(['time'], history, state);
      await this.cacheService.appendEntityMessage(
        waId,
        response,
        RoleEnum.ASSISTANT,
        Intention.CANCEL,
      );
      return { reply: response };
    }

    const resolvedState = !resolvedReservation
      ? state
      : {
          phone: state.phone,
          date: resolvedReservation.date,
          time: resolvedReservation.time,
          name: resolvedReservation.name,
        };

    const response = await this.deleteReservationQueueService.deleteReservation(resolvedState);

    const history = await this.cacheService.getHistory(waId);

    const cancelResponse = await this.aiService.cancelReservationResult(
      response,
      history,
      resolvedState,
    );

    await this.cacheService.appendEntityMessage(
      waId,
      cancelResponse,
      RoleEnum.ASSISTANT,
      Intention.CANCEL,
    );

    await this.cacheService.clearHistory(waId, CacheTypeEnum.CANCEL);
    await this.cacheService.clearAffectedReservationState(waId);

    await this.cacheService.markFlowCompleted(waId);

    this.logger.log(`Delete reservation strategy executed`);

    return { reply: cancelResponse };
  }
}
