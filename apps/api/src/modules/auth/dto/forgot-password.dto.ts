import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

/** Quên mật khẩu — nhập email đã đăng ký để nhận mật khẩu tạm. */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'chutro@gmail.com', description: 'Email đã đăng ký' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
