import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { BannerService } from './banner.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

/** File upload tối giản (memory storage). */
interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Admin - Banner')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/banners')
export class BannerAdminController {
  constructor(private readonly service: BannerService) {}

  @Get()
  @ApiOperation({ summary: 'Tất cả slide banner (gồm slide đang tắt)' })
  @ApiResponse({ status: 200, description: 'Danh sách slide' })
  list() {
    return this.service.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo slide mới' })
  @ApiResponse({ status: 201, description: 'Đã tạo' })
  create(@Body() dto: CreateBannerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nội dung / thứ tự / bật-tắt slide' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slide' })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá slide' })
  @ApiResponse({ status: 200, description: 'Đã xoá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy slide' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tải ảnh nền cho slide (tự nén < 2MB)' })
  @ApiResponse({ status: 201, description: 'Đã cập nhật ảnh' })
  @ApiResponse({ status: 400, description: 'Sai định dạng / vượt dung lượng' })
  setImage(@Param('id') id: string, @UploadedFile() file: UploadedFileLike) {
    return this.service.setImage(id, file);
  }
}
