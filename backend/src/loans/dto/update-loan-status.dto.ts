import { ApiProperty } from '@nestjs/swagger';
import { LoanStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateLoanStatusDto {
  @ApiProperty({ enum: LoanStatus, example: LoanStatus.CANCELLED })
  @IsEnum(LoanStatus)
  status: LoanStatus;
}
