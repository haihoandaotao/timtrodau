import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Tân sinh viên: đăng nhập bằng tài khoản thí sinh tuyển sinh + ngành dự kiến. */
export class ProspectiveLoginDto {
  @ApiProperty({ example: 'DDN2025001', description: 'Số báo danh (tài khoản tuyển sinh)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  sbd: string;

  @ApiProperty({ example: 'ThiSinh@123', description: 'Mật khẩu tài khoản thí sinh' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Kiến trúc', description: 'Ngành dự kiến nhập học' })
  @IsString()
  @MaxLength(100)
  intendedMajor: string;
}
