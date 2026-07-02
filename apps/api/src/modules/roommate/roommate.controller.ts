import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { RoommateService } from './roommate.service';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto';
import { QueryRoommateDto } from './dto/query-roommate.dto';
import { UpdateRoommatePostDto } from './dto/update-roommate-post.dto';

/** File upload tối giản (memory storage). */
interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

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

  @Roles(UserRole.STUDENT)
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh căn hộ cho tin (tối đa 10, tự nén < 2MB)' })
  @ApiResponse({ status: 201, description: 'Đã upload, trả danh sách ảnh' })
  @ApiResponse({ status: 400, description: 'Sai định dạng / vượt dung lượng' })
  uploadImages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFiles() files: UploadedFileLike[],
  ) {
    return this.service.addImages(id, user.id, files ?? []);
  }

  @Roles(UserRole.STUDENT)
  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Xoá 1 ảnh của tin (chủ tin)' })
  @ApiResponse({ status: 200, description: 'Đã xoá ảnh' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ảnh/tin' })
  removeImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.service.removeImage(id, imageId, user.id);
  }
}
