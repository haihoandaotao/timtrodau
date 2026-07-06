import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { RoommateGenderPref } from '../../../common/enums';

export class CreateRoommatePostDto {
  @ApiProperty({ example: 'Kiến trúc', description: 'Ngành bạn đang học' })
  @IsString()
  @MaxLength(100)
  major: string;

  @ApiProperty({ example: 'Số 10, Hòa Xuân, Cẩm Lệ, Đà Nẵng', description: 'Địa chỉ chỗ trọ' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  address: string;

  @ApiProperty({ example: '0905123456', description: 'SĐT liên hệ' })
  @IsString()
  @Matches(/^\d{8,11}$/, { message: 'Số điện thoại chỉ gồm 8–11 chữ số' })
  contactPhone: string;

  @ApiProperty({ example: 1500000, description: 'Tiền phòng / tháng (VND)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiPropertyOptional({
    enum: RoommateGenderPref,
    description: 'Giới tính bạn ghép mong muốn (mặc định ANY)',
  })
  @IsOptional()
  @IsEnum(RoommateGenderPref)
  genderPref?: RoommateGenderPref;

  @ApiPropertyOptional({ example: 1, description: 'ID khu vực chỗ trọ' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  preferredAreaId?: number;

  @ApiPropertyOptional({ example: 'Phòng 25m2, có gác, gần trường…' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
