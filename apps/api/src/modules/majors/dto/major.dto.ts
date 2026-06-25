import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMajorDto {
  @ApiProperty({ example: 'Kiến trúc' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

export class UpdateMajorDto {
  @ApiPropertyOptional({ example: 'Kiến trúc cảnh quan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: false, description: 'Bật/tắt ngành' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
