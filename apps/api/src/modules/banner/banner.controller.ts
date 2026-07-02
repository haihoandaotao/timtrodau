import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BannerService } from './banner.service';

@ApiTags('Banner')
@Controller('banners')
export class BannerController {
  constructor(private readonly service: BannerService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Danh sách slide banner đang bật (carousel trang chủ)' })
  @ApiResponse({ status: 200, description: 'Danh sách slide' })
  list() {
    return this.service.listPublic();
  }
}
