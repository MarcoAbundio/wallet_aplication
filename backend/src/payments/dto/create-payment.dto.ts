import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Loan this deposit is applied to' })
  @IsUUID()
  loanId: string;

  @ApiPropertyOptional({
    description:
      'Specific installment to start applying the payment to. If omitted, the payment ' +
      'is applied automatically to the earliest pending installment(s).',
  })
  @IsOptional()
  @IsUUID()
  installmentId?: string;

  @ApiProperty({ example: 5000, description: 'Amount deposited' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Date the payment was made, defaults to now' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ example: 'REF-00123' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
