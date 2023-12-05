import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('ping')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Ping',
    description:
      'Returns "pong". Useful for Kubernetes liveness probes. Tells us only that the nestJS application is serving traffic, but not that downstream services are healthy.',
  })
  @ApiResponse({
    type: String,
    status: 200,
  })
  getOk(): string {
    return 'pong';
  }
}
