import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ example: 'Tân sinh viên 2026 — đăng ký ngay hôm nay' })
  @IsString()
  @MinLength(1)
  @MaxLength(191)
  title: string;

  @ApiPropertyOptional({ example: 'Tạo tài khoản để lưu phòng, giữ chỗ…' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Đại học Kiến trúc Đà Nẵng' })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  headerLabel?: string;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị (nhỏ hiện trước)' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Bật/tắt slide' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
