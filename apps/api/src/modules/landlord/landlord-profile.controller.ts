import { Body, Controller, Get, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { LandlordProfileService } from './landlord-profile.service';

class UpdateLandlordProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(191)
  representativeName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s.]/g, '') : value))
  @Matches(/^\d{8,11}$/, { message: 'Số điện thoại chỉ gồm 8–11 chữ số' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}

interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Landlord Profile')
@ApiBearerAuth()
@Roles(UserRole.LANDLORD)
@Controller('landlord/profile')
export class LandlordProfileController {
  constructor(private readonly service: LandlordProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Hồ sơ chỗ trọ của tôi' })
  @ApiResponse({ status: 200, description: 'Hồ sơ' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.service.getMine(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật hồ sơ (người đại diện, SĐT, địa chỉ)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateLandlordProfileDto) {
    return this.service.update(user.id, dto);
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh mặt đại diện' })
  @ApiResponse({ status: 201, description: 'Đã lưu ảnh, trả URL' })
  setPhoto(@CurrentUser() user: AuthUser, @UploadedFile() file: UploadedFileLike) {
    return this.service.setPhoto(user.id, file);
  }
}
