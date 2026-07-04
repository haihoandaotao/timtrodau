import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** Đăng nhập/đăng ký chủ trọ bằng Google — gửi ID token lấy từ Google Identity Services. */
export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token (credential) từ nút đăng nhập Google' })
  @IsString()
  idToken: string;
}
