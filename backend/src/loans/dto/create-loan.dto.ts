import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentFrequency } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ description: 'ID of the client receiving the loan' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 50000, description: 'Principal amount disbursed' })
  @IsNumber()
  @Min(1)
  principal: number;

  @ApiProperty({ example: 24, description: 'Annual interest rate (percentage)' })
  @IsNumber()
  @Min(0)
  @Max(200)
  interestRate: number;

  @ApiProperty({ example: 12, description: 'Number of installments to repay the loan' })
  @IsInt()
  @Min(1)
  @Max(120)
  termInstallments: number;

  @ApiProperty({ enum: PaymentFrequency, example: PaymentFrequency.MONTHLY })
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: 'Capital de trabajo para negocio' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
