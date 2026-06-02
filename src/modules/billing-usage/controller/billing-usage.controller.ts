import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { InternalApiTokenGuard } from 'src/common/guards/internal-api-token.guard';
import { INTERNAL_API_TOKEN_HEADER } from 'src/constants';
import { GetWhatsappReservationQuotaSummaryUseCase } from '../application/get-whatsapp-reservation-quota-summary.use-case';
import { BillingAccountParamDto } from '../dto/billing-account-param.dto';
import { BillingQuotaSummaryResponseDto } from '../dto/billing-quota-summary-response.dto';

@Controller('billing-usage')
@ApiTags('Billing Usage')
@UseGuards(InternalApiTokenGuard)
@ApiSecurity('internal-api-token')
@ApiHeader({
  name: INTERNAL_API_TOKEN_HEADER,
  description: 'Token interno requerido para consumir endpoints internos.',
  required: true,
})
export class BillingUsageController {
  constructor(
    private readonly getWhatsappReservationQuotaSummaryUseCase: GetWhatsappReservationQuotaSummaryUseCase,
  ) {}

  @Get('accounts/:accountId/whatsapp-reservation-quota')
  @ApiOperation({
    summary: 'Obtener cupo disponible de reservas por agente',
    description:
      'Devuelve limite, consumo, restante y estado del cupo de reservas por WhatsApp/agent para la cuenta solicitada.',
  })
  @ApiOkResponse({
    description: 'Resumen de cupo de reservas por agente para la cuenta.',
    type: BillingQuotaSummaryResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'El request no incluyo un token interno valido.',
  })
  getWhatsappReservationQuota(
    @Param() params: BillingAccountParamDto,
  ): Promise<BillingQuotaSummaryResponseDto> {
    return this.getWhatsappReservationQuotaSummaryUseCase.execute(params.accountId);
  }
}
