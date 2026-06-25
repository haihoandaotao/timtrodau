import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '../../common/enums';
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

  @Patch(':id/status')
  @ApiOperation({ summary: 'Khoá/mở tài khoản (ACTIVE | BLOCKED)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  setStatus(@Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.service.setStatus(id, dto.status);
  }
}
