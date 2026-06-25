import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LandlordRegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên chủ trọ' })
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  fullName: string;

  @ApiProperty({ example: '0905123456', description: 'Số điện thoại' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ example: 'MatKhau@123', description: 'Mật khẩu (>= 6 ký tự)' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: '048201001234', description: 'Số CCCD (để Admin xác minh)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  idCardNo: string;

  @ApiProperty({ example: '123 Hòa Xuân, Cẩm Lệ, Đà Nẵng', description: 'Địa chỉ' })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiPropertyOptional({ description: 'URL ảnh CCCD (sau khi upload)' })
  @IsOptional()
  @IsString()
  idCardImageUrl?: string;
}
