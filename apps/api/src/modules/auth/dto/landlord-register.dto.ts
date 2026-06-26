import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Chủ trọ đăng ký bằng Gmail; thông tin chỗ trọ hoàn thiện sau khi đăng nhập. */
export class LandlordRegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên người quản lý' })
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  fullName: string;

  @ApiProperty({ example: 'chutro@gmail.com', description: 'Email (dùng để đăng nhập)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: 'MatKhau@123', description: 'Mật khẩu (>= 6 ký tự)' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ example: '0905123456', description: 'SĐT liên hệ (có thể bổ sung sau)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;
}
