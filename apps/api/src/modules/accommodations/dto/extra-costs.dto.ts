import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Chi phí phát sinh (mô tả linh hoạt, VD "3.500đ/kWh"). */
export class ExtraCostsDto {
  @ApiPropertyOptional({ example: '3.500đ/kWh' })
  @IsOptional()
  @IsString()
  electricity?: string;

  @ApiPropertyOptional({ example: '15.000đ/người/tháng' })
  @IsOptional()
  @IsString()
  water?: string;

  @ApiPropertyOptional({ example: '20.000đ/tháng' })
  @IsOptional()
  @IsString()
  sanitation?: string;

  @ApiPropertyOptional({ example: 'Miễn phí' })
  @IsOptional()
  @IsString()
  internet?: string;
}
