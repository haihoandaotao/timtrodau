import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  fullName?: string;

  @ApiPropertyOptional({ example: 'a@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0905123456' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s.]/g, '') : value))
  @Matches(/^\d{8,11}$/, { message: 'Số điện thoại chỉ gồm 8–11 chữ số' })
  phone?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'MatKhauCu@123' })
  @IsString()
  currentPassword: string;

  @ApiPropertyOptional({ example: 'MatKhauMoi@123' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  newPassword: string;
}
