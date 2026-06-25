import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Kiểm tra API còn sống. Dùng cho monitoring & smoke test.',
  })
  @ApiResponse({
    status: 200,
    description: 'API hoạt động bình thường',
    schema: {
      example: { status: 'ok', service: 'dal-api', timestamp: '2026-06-25T00:00:00.000Z' },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'dal-api',
      timestamp: new Date().toISOString(),
    };
  }
}
