import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { AccommodationType } from '../../../common/enums';

/** Smart Filter cho danh sách phòng công khai (DAL-8). Query params đều optional. */
export class QueryAccommodationDto {
  @ApiPropertyOptional({ description: 'ID khu vực' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  areaId?: number;

  @ApiPropertyOptional({ description: 'Khoảng cách tối đa tới trường (km), VD 1, 2, 5' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceMax?: number;

  @ApiPropertyOptional({ description: 'Giá tối thiểu (VND/tháng)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Giá tối đa (VND/tháng)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ enum: AccommodationType, description: 'Loại hình' })
  @IsOptional()
  @IsEnum(AccommodationType)
  type?: AccommodationType;

  @ApiPropertyOptional({ type: [Number], description: 'ID tiện ích (phải có ĐỦ tất cả)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((v) => Number(v));
  })
  @IsArray()
  @IsInt({ each: true })
  amenityIds?: number[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
