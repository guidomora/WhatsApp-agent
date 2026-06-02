import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BillingAccountParamDto {
  @ApiProperty({
    description: 'Identificador de la cuenta cliente.',
    example: 'account-1',
  })
  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
