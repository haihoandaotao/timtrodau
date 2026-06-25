import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { ModerationService } from './moderation.service';
import { ModerateAccommodationDto, ModerateLandlordDto } from './dto/moderate.dto';

@ApiTags('Admin - Moderation')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/moderation')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Get('accommodations')
  @ApiOperation({ summary: 'Danh sách bài đăng chờ duyệt' })
  @ApiResponse({ status: 200, description: 'Danh sách PENDING' })
  pendingAccommodations() {
    return this.service.listPendingAccommodations();
  }

  @Patch('accommodations/:id')
  @ApiOperation({ summary: 'Duyệt/từ chối bài đăng (REJECT bắt buộc có lý do)' })
  @ApiResponse({ status: 200, description: 'Đã xử lý' })
  @ApiResponse({ status: 400, description: 'Thiếu lý do khi từ chối' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đăng' })
  moderateAccommodation(@Param('id') id: string, @Body() dto: ModerateAccommodationDto) {
    return this.service.moderateAccommodation(id, dto);
  }

  @Get('landlords')
  @ApiOperation({ summary: 'Danh sách chủ trọ chờ xác minh' })
  @ApiResponse({ status: 200, description: 'Danh sách chờ duyệt' })
  pendingLandlords() {
    return this.service.listPendingLandlords();
  }

  @Patch('landlords/:userId')
  @ApiOperation({ summary: 'Duyệt/từ chối chủ trọ (APPROVE kích hoạt tài khoản)' })
  @ApiResponse({ status: 200, description: 'Đã xử lý' })
  @ApiResponse({ status: 400, description: 'Thiếu lý do khi từ chối' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hồ sơ' })
  moderateLandlord(@Param('userId') userId: string, @Body() dto: ModerateLandlordDto) {
    return this.service.moderateLandlord(userId, dto);
  }
}
