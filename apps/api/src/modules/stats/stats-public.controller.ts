import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { StatsService } from './stats.service';

/** Số liệu công khai cho trang chủ (không cần đăng nhập). */
@ApiTags('Public Stats')
@Public()
@Controller('public/stats')
export class StatsPublicController {
  constructor(private readonly service: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Số liệu tổng quan công khai (theo loại hình + lượt đăng ký)' })
  @ApiResponse({ status: 200, description: 'Tổng quan' })
  overview() {
    return this.service.publicOverview();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Phòng/căn hộ nổi bật' })
  @ApiResponse({ status: 200, description: 'Danh sách nổi bật' })
  featured() {
    return this.service.featured();
  }

  @Get('price-distribution')
  @ApiOperation({ summary: 'Phân bố theo khoảng giá (công khai)' })
  @ApiResponse({ status: 200, description: 'Mảng bucket + count' })
  priceDistribution() {
    return this.service.priceDistribution();
  }

  @Get('area-distribution')
  @ApiOperation({ summary: 'Phân bố theo khu vực (công khai)' })
  @ApiResponse({ status: 200, description: 'Mảng area + count' })
  areaDistribution() {
    return this.service.areaDistribution();
  }
}
