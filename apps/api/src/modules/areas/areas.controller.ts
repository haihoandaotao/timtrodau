import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AreasService } from './areas.service';

class AreaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

@ApiTags('Admin - Areas')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/areas')
export class AreasController {
  constructor(private readonly service: AreasService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phường/xã' })
  @ApiResponse({ status: 200, description: 'Danh sách' })
  list() {
    return this.service.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Thêm phường/xã' })
  @ApiResponse({ status: 201, description: 'Đã thêm' })
  @ApiResponse({ status: 409, description: 'Đã tồn tại' })
  create(@Body() dto: AreaDto) {
    return this.service.create(dto.name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa tên phường/xã' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: AreaDto) {
    return this.service.update(id, dto.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá phường/xã' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
