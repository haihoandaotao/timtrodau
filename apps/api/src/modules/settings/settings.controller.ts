import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { UpdateModerationSettingsDto } from './dto/update-moderation-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Admin - Settings')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('moderation')
  @ApiOperation({ summary: 'Lấy cấu hình kiểm duyệt (auto-approve)' })
  @ApiResponse({ status: 200, description: '{ autoApprove }' })
  getModeration() {
    return this.service.getModeration();
  }

  @Patch('moderation')
  @ApiOperation({ summary: 'Bật/tắt tự động duyệt bài đăng' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  async updateModeration(@Body() dto: UpdateModerationSettingsDto) {
    await this.service.setAutoApprove(dto.autoApprove);
    return this.service.getModeration();
  }
}
