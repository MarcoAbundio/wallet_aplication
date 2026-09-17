import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiExcludeEndpoint()
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
