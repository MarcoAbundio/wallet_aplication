import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'High level KPIs: portfolio, collections, pending and overdue totals' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('collections-by-month')
  @ApiOperation({ summary: 'Amount collected per month, for the collections trend chart' })
  getCollectionsByMonth(@Query('months') months?: string) {
    return this.dashboardService.getCollectionsByMonth(months ? Number(months) : undefined);
  }

  @Get('disbursements-by-month')
  @ApiOperation({ summary: 'Principal disbursed per month, for the origination trend chart' })
  getDisbursementsByMonth(@Query('months') months?: string) {
    return this.dashboardService.getDisbursementsByMonth(months ? Number(months) : undefined);
  }

  @Get('loans-by-status')
  @ApiOperation({ summary: 'Loan portfolio distribution by status, for the donut chart' })
  getLoansByStatus() {
    return this.dashboardService.getLoansByStatus();
  }

  @Get('top-overdue-clients')
  @ApiOperation({ summary: 'Clients ranked by outstanding overdue balance' })
  getTopOverdueClients(@Query('limit') limit?: string) {
    return this.dashboardService.getTopOverdueClients(limit ? Number(limit) : undefined);
  }
}
