import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanQueryDto } from './dto/loan-query.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('loans')
@ApiBearerAuth('access-token')
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Post()
  @ApiOperation({ summary: 'Create a new loan and generate its payment schedule' })
  create(@Body() dto: CreateLoanDto, @CurrentUser() user: CurrentUserPayload) {
    return this.loansService.create(dto, user.userId);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Get()
  @ApiOperation({ summary: 'List loans with filters for status, client and search term' })
  findAll(@Query() query: LoanQueryDto) {
    return this.loansService.findAll(query);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Get(':id')
  @ApiOperation({ summary: 'Get loan details including installments and payment history' })
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Change loan status (e.g. cancel a loan)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLoanStatusDto) {
    return this.loansService.updateStatus(id, dto.status);
  }
}
