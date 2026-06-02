import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WhatsappReservationQuotaState } from 'src/lib';

class BillingQuotaSummaryPlanResponseDto {
  @ApiProperty({
    description: 'Identificador del plan activo.',
    example: 'plan-1',
  })
  id!: string;

  @ApiProperty({
    description: 'Codigo estable del plan activo.',
    example: 'basic',
  })
  code!: string;

  @ApiProperty({
    description: 'Nombre visible del plan activo.',
    example: 'Basic',
  })
  name!: string;

  @ApiProperty({
    description: 'Limite mensual de reservas por WhatsApp/agent para el plan.',
    example: 100,
    nullable: true,
  })
  monthlyWhatsappReservationLimit!: number | null;
}

export class BillingQuotaSummaryResponseDto {
  @ApiProperty({
    description: 'Identificador de la cuenta consultada.',
    example: 'account-1',
  })
  accountId!: string;

  @ApiProperty({
    description: 'Periodo mensual de consumo evaluado.',
    example: '2026-06',
  })
  period!: string;

  @ApiProperty({
    description: 'Inicio del periodo de facturacion activo.',
    example: '2026-06-01T00:00:00.000Z',
    nullable: true,
  })
  periodStart!: string | null;

  @ApiProperty({
    description: 'Fin del periodo de facturacion activo.',
    example: '2026-07-01T00:00:00.000Z',
    nullable: true,
  })
  periodEnd!: string | null;

  @ApiProperty({
    description: 'Plan activo usado para calcular el cupo.',
    type: BillingQuotaSummaryPlanResponseDto,
    nullable: true,
  })
  plan!: BillingQuotaSummaryPlanResponseDto | null;

  @ApiProperty({
    description: 'Reservas consumidas en el periodo.',
    example: 82,
  })
  used!: number;

  @ApiProperty({
    description: 'Reservas restantes disponibles. Nunca es negativo.',
    example: 18,
  })
  remaining!: number;

  @ApiProperty({
    description: 'Reservas consumidas por encima del limite finito.',
    example: 0,
  })
  overage!: number;

  @ApiProperty({
    description: 'Estado listo para que el frontend represente el cupo.',
    enum: WhatsappReservationQuotaState,
    example: WhatsappReservationQuotaState.NEAR_LIMIT,
  })
  state!: WhatsappReservationQuotaState;

  @ApiPropertyOptional({
    description: 'Motivo por el cual el cupo no esta disponible.',
    example: 'missing_active_subscription',
  })
  unavailableReason?: string;
}
