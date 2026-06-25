import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '2024110001', description: 'Mã số sinh viên / Số báo danh' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  studentCode: string;

  @ApiProperty({ example: '0905123456', description: 'Số điện thoại nhận OTP (VN)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại không hợp lệ (định dạng 0xxxxxxxxx)' })
  phone: string;
}
