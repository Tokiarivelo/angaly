import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface HealthCheckResult {
  status: 'ok';
  timestamp: string;
  environment: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Vérifie que le serveur API est opérationnel. Utilisé par Docker et les load balancers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Le serveur est opérationnel',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time', example: '2026-01-01T10:00:00.000Z' },
        environment: { type: 'string', example: 'development' },
      },
    },
  })
  check(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env['NODE_ENV'] ?? 'development',
    };
  }
}
