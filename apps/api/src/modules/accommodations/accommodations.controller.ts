import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { AccommodationsService } from './accommodations.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { QueryAccommodationDto } from './dto/query-accommodation.dto';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';

/** File upload tối giản (memory storage) — chỉ lấy trường cần cho StorageService. */
interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Accommodations')
@ApiBearerAuth()
@Controller('accommodations')
export class AccommodationsController {
  constructor(private readonly service: AccommodationsService) {}

  // ---------- Public (Sinh viên) ----------

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Danh sách phòng công khai + Smart Filter',
    description: 'Chỉ trả phòng đã duyệt (PUBLISHED). Lọc theo khu vực/giá/loại/tiện ích.',
  })
  @ApiResponse({ status: 200, description: 'Danh sách phân trang' })
  @ApiResponse({ status: 400, description: 'Tham số lọc không hợp lệ (vd priceMin > priceMax)' })
  findPublic(@Query() query: QueryAccommodationDto) {
    return this.service.findPublic(query);
  }

  @Public()
  @Get('areas')
  @ApiOperation({ summary: 'Danh sách khu vực gợi ý' })
  @ApiResponse({ status: 200, description: 'Danh sách khu vực' })
  listAreas() {
    return this.service.listAreas();
  }

  @Public()
  @Get('amenities')
  @ApiOperation({ summary: 'Danh mục tiện ích' })
  @ApiResponse({ status: 200, description: 'Danh sách tiện ích' })
  listAmenities() {
    return this.service.listAmenities();
  }

  @Roles(UserRole.LANDLORD)
  @Post()
  @ApiOperation({ summary: 'Chủ trọ tạo bài đăng (→ PENDING chờ duyệt)' })
  @ApiResponse({ status: 201, description: 'Đã tạo, chờ Admin duyệt' })
  @ApiResponse({ status: 403, description: 'Chủ trọ chưa được duyệt' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccommodationDto) {
    return this.service.create(user.id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Get('mine')
  @ApiOperation({ summary: 'Danh sách bài đăng của chủ trọ' })
  @ApiResponse({ status: 200, description: 'Danh sách bài đăng' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findMine(user.id);
  }

  @Roles(UserRole.LANDLORD)
  @Patch(':id')
  @ApiOperation({ summary: 'Sửa bài đăng (đưa về PENDING để duyệt lại)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  @ApiResponse({ status: 403, description: 'Không phải chủ sở hữu' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đăng' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAccommodationDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Patch(':id/availability')
  @ApiOperation({ summary: 'Toggle còn/hết phòng' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật trạng thái phòng' })
  @ApiResponse({ status: 403, description: 'Không phải chủ sở hữu' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đăng' })
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ToggleAvailabilityDto,
  ) {
    return this.service.toggleAvailability(id, user.id, dto.isAvailable);
  }

  @Roles(UserRole.LANDLORD)
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh/video cho bài đăng (tối đa 10 file)' })
  @ApiResponse({ status: 201, description: 'Đã upload, trả danh sách media' })
  @ApiResponse({ status: 400, description: 'Sai định dạng / vượt dung lượng' })
  uploadImages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFiles() files: UploadedFileLike[],
  ) {
    return this.service.addImages(id, user.id, files ?? []);
  }

  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa (soft delete) bài đăng' })
  @ApiResponse({ status: 204, description: 'Đã xóa' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài đăng' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, user);
  }

  // ':id' khai báo SAU các route tĩnh (areas/amenities/mine) để không bị nuốt.
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phòng (công khai)' })
  @ApiResponse({ status: 200, description: 'Chi tiết phòng (media, bản đồ, chi phí)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy/chưa duyệt/đã xóa' })
  findDetail(@Param('id') id: string) {
    return this.service.findPublicById(id);
  }
}
