import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AdmissionApiService } from './admission-api.service';

@ApiTags('Admin - Admission Sync')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/admission')
export class AdmissionController {
  constructor(private readonly service: AdmissionApiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Trạng thái tích hợp API tuyển sinh (đã cấu hình key? đã đồng bộ?)' })
  @ApiResponse({ status: 200, description: 'configured + syncedCount' })
  status() {
    return this.service.status();
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đồng bộ thí sinh chính thức từ hệ thống tuyển sinh' })
  @ApiResponse({ status: 200, description: 'synced + total' })
  @ApiResponse({ status: 400, description: 'Chưa cấu hình API key' })
  @ApiResponse({ status: 503, description: 'Không kết nối được API tuyển sinh' })
  sync() {
    return this.service.sync();
  }

  @Get('candidates')
  @ApiOperation({ summary: 'Danh sách Tân sinh viên dự kiến (phân trang + lọc)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'major', required: false })
  @ApiQuery({ name: 'source', required: false, enum: ['official', 'self'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiResponse({ status: 200, description: 'Danh sách phân trang' })
  candidates(
    @Query('q') q?: string,
    @Query('major') major?: string,
    @Query('source') source?: string,
    @Query('page') page?: string,
  ) {
    return this.service.listCandidates({
      q,
      major,
      source,
      page: page ? Number(page) : undefined,
    });
  }

  @Get('candidate-stats')
  @ApiOperation({ summary: 'Thống kê Tân sinh viên dự kiến theo ngành' })
  @ApiResponse({ status: 200, description: 'total + byMajor' })
  candidateStats() {
    return this.service.candidateStats();
  }
}
