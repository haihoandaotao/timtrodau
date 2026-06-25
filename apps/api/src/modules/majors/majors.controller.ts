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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { MajorsService } from './majors.service';
import { CreateMajorDto, UpdateMajorDto } from './dto/major.dto';

@ApiTags('Majors')
@Controller()
export class MajorsController {
  constructor(private readonly service: MajorsService) {}

  @Public()
  @Get('majors')
  @ApiOperation({ summary: 'Danh sách ngành đang mở (cho tân SV chọn)' })
  @ApiResponse({ status: 200, description: 'Danh sách ngành active' })
  listActive() {
    return this.service.listActive();
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('admin/majors')
  @ApiOperation({ summary: 'Admin: tất cả ngành' })
  listAll() {
    return this.service.listAll();
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post('admin/majors')
  @ApiOperation({ summary: 'Admin: thêm ngành' })
  @ApiResponse({ status: 201, description: 'Đã thêm' })
  @ApiResponse({ status: 409, description: 'Ngành đã tồn tại' })
  create(@Body() dto: CreateMajorDto) {
    return this.service.create(dto.name);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch('admin/majors/:id')
  @ApiOperation({ summary: 'Admin: sửa/bật-tắt ngành' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMajorDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete('admin/majors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: xoá ngành' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
