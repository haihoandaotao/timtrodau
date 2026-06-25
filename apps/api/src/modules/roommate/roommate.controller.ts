import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { RoommateService } from './roommate.service';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto';
import { QueryRoommateDto } from './dto/query-roommate.dto';
import { UpdateRoommatePostDto } from './dto/update-roommate-post.dto';

@ApiTags('Roommate')
@ApiBearerAuth()
@Controller('roommates')
export class RoommateController {
  constructor(private readonly service: RoommateService) {}

  @Roles(UserRole.STUDENT)
  @Get()
  @ApiOperation({ summary: 'Danh sách tin tìm bạn ở ghép (lọc theo ngành)' })
  @ApiResponse({ status: 200, description: 'Danh sách tin OPEN' })
  findAll(@Query() query: QueryRoommateDto) {
    return this.service.findAll(query);
  }

  @Roles(UserRole.STUDENT)
  @Post()
  @ApiOperation({ summary: 'Tạo tin tìm bạn ở ghép' })
  @ApiResponse({ status: 201, description: 'Đã tạo tin' })
  @ApiResponse({ status: 400, description: 'Thiếu ngành học' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoommatePostDto) {
    return this.service.create(user.id, dto);
  }

  @Roles(UserRole.STUDENT)
  @Patch(':id')
  @ApiOperation({ summary: 'Sửa/đóng tin (chỉ chủ tin)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  @ApiResponse({ status: 403, description: 'Không phải chủ tin' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoommatePostDto,
  ) {
    return this.service.update(id, user.id, dto);
  }
}
