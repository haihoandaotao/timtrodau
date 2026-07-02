import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';

class QueryUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

class SetStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}

class SetLandlordApprovalDto {
  @IsBoolean()
  approve: boolean;
}

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách người dùng (lọc theo vai trò, phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách phân trang' })
  list(@Query() query: QueryUsersDto) {
    return this.service.listForAdmin(query);
  }

  @Get('landlords/stats')
  @ApiOperation({ summary: 'Thống kê số lượng chủ trọ theo trạng thái' })
  @ApiResponse({ status: 200, description: 'total/approved/pending/rejected' })
  landlordStats() {
    return this.service.landlordStats();
  }

  @Get(':id/landlord')
  @ApiOperation({ summary: 'Xem hồ sơ chi tiết chủ trọ (kèm CCCD) — chỉ Admin' })
  @ApiResponse({ status: 200, description: 'Hồ sơ chi tiết' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chủ trọ' })
  landlordDetail(@Param('id') id: string) {
    return this.service.landlordDetail(id);
  }

  @Patch(':id/landlord-approval')
  @ApiOperation({ summary: 'Duyệt / Hủy duyệt chủ trọ' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chủ trọ' })
  setLandlordApproval(@Param('id') id: string, @Body() dto: SetLandlordApprovalDto) {
    return this.service.setLandlordApproval(id, dto.approve);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Khoá/mở tài khoản (ACTIVE | BLOCKED)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  setStatus(@Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.service.setStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá tài khoản người dùng (không xoá ADMIN/chính mình)' })
  @ApiResponse({ status: 200, description: 'Đã xoá' })
  @ApiResponse({ status: 403, description: 'Không được phép' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.deleteUser(id, user.id);
  }
}
