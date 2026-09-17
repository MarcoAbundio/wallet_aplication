import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth('access-token')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Post()
  @ApiOperation({ summary: 'Register a new client' })
  create(@Body() dto: CreateClientDto, @CurrentUser() user: CurrentUserPayload) {
    return this.clientsService.create(dto, user.userId);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Get()
  @ApiOperation({ summary: 'Search and list clients (used by the client search bar)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Get(':id')
  @ApiOperation({ summary: 'Get client details including all of their loans' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Get(':id/summary')
  @ApiOperation({ summary: "Get a client's pending and overdue installments" })
  getSummary(@Param('id') id: string) {
    return this.clientsService.getSummary(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update client information' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  @ApiOperation({ summary: 'Mark a client as inactive' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
