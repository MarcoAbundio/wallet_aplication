import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoansScheduler } from './loans.scheduler';

@Module({
  controllers: [LoansController],
  providers: [LoansService, LoansScheduler],
  exports: [LoansService],
})
export class LoansModule {}
