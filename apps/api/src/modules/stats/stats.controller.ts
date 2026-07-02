import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { StatsService } from './stats.service';

@ApiTags('Admin - Stats')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Số liệu tổng quan' })
  @ApiResponse({
    status: 200,
    description: 'studentsFoundRoom, publishedAccommodations, totalBookings',
  })
  overview() {
    return this.service.overview();
  }

  @Get('price-distribution')
  @ApiOperation({ summary: 'Phân bố theo khoảng giá' })
  @ApiResponse({ status: 200, description: 'Mảng bucket + count' })
  priceDistribution() {
    return this.service.priceDistribution();
  }

  @Get('area-distribution')
  @ApiOperation({ summary: 'Phân bố booking theo khu vực' })
  @ApiResponse({ status: 200, description: 'Mảng area + count' })
  areaDistribution() {
    return this.service.areaDistribution();
  }

  @Get('accommodations-by-area')
  @ApiOperation({ summary: 'Số lượng phòng (đã duyệt) theo khu vực' })
  @ApiResponse({ status: 200, description: 'Mảng area + count' })
  accommodationsByArea() {
    return this.service.accommodationsByArea();
  }

  @Get('trusted-landlords')
  @ApiOperation({ summary: 'Chủ trọ uy tín' })
  @ApiResponse({ status: 200, description: 'Top chủ trọ uy tín (không lộ CCCD)' })
  trustedLandlords() {
    return this.service.trustedLandlords();
  }

  @Get('prospective-by-major')
  @ApiOperation({ summary: 'Số tân sinh viên đã đăng ký theo từng ngành' })
  @ApiResponse({ status: 200, description: 'Mảng major + count' })
  prospectiveByMajor() {
    return this.service.prospectiveByMajor();
  }
}
