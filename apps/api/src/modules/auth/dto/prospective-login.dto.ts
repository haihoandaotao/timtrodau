import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MinLength } from 'class-validator';

/** Tân sinh viên: đăng nhập bằng email HOẶC SĐT + mật khẩu là ngày sinh. */
export class ProspectiveLoginDto {
  @ApiProperty({ example: 'thisinh@gmail.com', description: 'Email hoặc số điện thoại' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  identifier: string;

  @ApiProperty({ example: '2007-05-12', description: 'Ngày sinh (yyyy-mm-dd) — mật khẩu' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày sinh phải dạng yyyy-mm-dd' })
  dob: string;
}
