import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QueryRoommateDto {
  @ApiPropertyOptional({ description: 'Lọc theo ngành học' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ description: 'ID khu vực' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  areaId?: number;

  @ApiPropertyOptional({ description: 'Ngân sách tối đa (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax?: number;
}
