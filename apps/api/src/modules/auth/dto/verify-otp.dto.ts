import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '12', description: 'ID của yêu cầu OTP (trả về từ /auth/otp/request)' })
  @IsString()
  requestId: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP nhận được' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(4, 8)
  code: string;
}
