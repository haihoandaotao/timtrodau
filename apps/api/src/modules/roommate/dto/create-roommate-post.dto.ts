import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRoommatePostDto {
  @ApiProperty({ example: 'Kiến trúc', description: 'Ngành học (để ghép cùng ngành)' })
  @IsString()
  @MaxLength(100)
  major: string;

  @ApiPropertyOptional({ example: 1500000, description: 'Ngân sách dự kiến (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID khu vực mong muốn' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  preferredAreaId?: number;

  @ApiPropertyOptional({ example: 'Tìm 1 bạn nam ở ghép gần trường' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
