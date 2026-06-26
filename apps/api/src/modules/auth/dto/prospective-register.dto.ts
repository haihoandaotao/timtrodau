import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Thí sinh tự đăng ký để đăng nhập (chưa có trong hệ thống tuyển sinh). */
export class ProspectiveRegisterDto {
  @ApiProperty({ example: 'Nguyễn Thí Sinh' })
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  fullName: string;

  @ApiPropertyOptional({
    example: 'thisinh@gmail.com',
    description: 'Email (email hoặc SĐT bắt buộc 1)',
  })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiPropertyOptional({ example: '0905123456' })
  @ValidateIf((o) => !o.email)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiProperty({ example: '2007-05-12', description: 'Ngày sinh (yyyy-mm-dd) — sẽ là mật khẩu' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày sinh phải dạng yyyy-mm-dd' })
  dob: string;

  @ApiProperty({ example: 'Kiến trúc', description: 'Ngành dự kiến (chọn từ danh sách)' })
  @IsString()
  @MaxLength(100)
  intendedMajor: string;

  @ApiProperty({ example: 2026, description: 'Năm dự kiến nhập học' })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  enrollmentYear: number;
}
