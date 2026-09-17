import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoansService } from './loans.service';

@Injectable()
export class LoansScheduler {
  private readonly logger = new Logger(LoansScheduler.name);

  constructor(private readonly loansService: LoansService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleOverdueSync() {
    await this.loansService.syncOverdueLoans();
    this.logger.log('Overdue installments and loans synced');
  }
}
