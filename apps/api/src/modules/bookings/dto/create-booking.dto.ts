import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: '1', description: 'ID phòng muốn giữ chỗ' })
  @IsString()
  accommodationId: string;

  @ApiPropertyOptional({ example: 'Em muốn xem phòng cuối tuần này' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
