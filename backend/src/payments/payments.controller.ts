import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a deposit / payment against a loan' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.paymentsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List payments with filters by loan or client' })
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single payment record' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
