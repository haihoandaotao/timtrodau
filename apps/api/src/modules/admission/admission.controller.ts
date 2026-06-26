import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
}
