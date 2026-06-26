import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'chutro@gmail.com', description: 'Email hoặc số điện thoại' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'MatKhau@123', description: 'Mật khẩu' })
  @IsString()
  @MinLength(6)
  password: string;
}
