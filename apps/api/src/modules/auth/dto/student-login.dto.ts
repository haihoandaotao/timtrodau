import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Sinh viên trường: đăng nhập bằng MSSV + mật khẩu là ngày sinh (yyyy-mm-dd). */
export class StudentLoginDto {
  @ApiProperty({ example: '2021120001', description: 'Mã số sinh viên' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  studentCode: string;

  @ApiProperty({ example: '2003-05-12', description: 'Ngày sinh (yyyy-mm-dd) — dùng làm mật khẩu' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày sinh phải dạng yyyy-mm-dd' })
  dob: string;
}
