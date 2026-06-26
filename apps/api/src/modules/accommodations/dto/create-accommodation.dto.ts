import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AccommodationType } from '../../../common/enums';
import { ExtraCostsDto } from './extra-costs.dto';

export class CreateAccommodationDto {
  @ApiProperty({ example: 'Phòng trọ Hòa Xuân gần DAU' })
  @IsString()
  @MaxLength(191)
  title: string;

  @ApiPropertyOptional({ example: 'Phòng 20m2, có gác lửng, an ninh tốt' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2000000, description: 'Giá thuê (VND/tháng)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: AccommodationType, example: AccommodationType.TRADITIONAL })
  @IsEnum(AccommodationType)
  type: AccommodationType;

  @ApiProperty({ example: '123 Hòa Xuân, Cẩm Lệ, Đà Nẵng' })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiPropertyOptional({ example: 'https://maps.app.goo.gl/...', description: 'Link Google Maps' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mapUrl?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID khu vực' })
  @IsOptional()
  @IsInt()
  areaId?: number;

  @ApiPropertyOptional({ example: 16.0205 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: 108.221 })
  @IsOptional()
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Khoảng cách tới trường (km)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiPropertyOptional({ type: ExtraCostsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtraCostsDto)
  extraCosts?: ExtraCostsDto;

  @ApiPropertyOptional({ type: [Number], example: [1, 2], description: 'Danh sách ID tiện ích' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  amenityIds?: number[];
}
