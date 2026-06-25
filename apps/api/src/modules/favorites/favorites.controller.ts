import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@Roles(UserRole.STUDENT)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phòng đã lưu' })
  @ApiResponse({ status: 200, description: 'Danh sách phòng' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }

  @Get('ids')
  @ApiOperation({ summary: 'ID phòng đã lưu (để tô tim)' })
  ids(@CurrentUser() user: AuthUser) {
    return this.service.listIds(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Lưu phòng yêu thích' })
  @ApiResponse({ status: 201, description: 'Đã lưu' })
  add(@CurrentUser() user: AuthUser, @Body('accommodationId') accommodationId: string) {
    return this.service.add(user.id, accommodationId);
  }

  @Delete(':accommodationId')
  @ApiOperation({ summary: 'Bỏ lưu phòng' })
  @ApiResponse({ status: 200, description: 'Đã bỏ lưu' })
  remove(@CurrentUser() user: AuthUser, @Param('accommodationId') accommodationId: string) {
    return this.service.remove(user.id, accommodationId);
  }
}
