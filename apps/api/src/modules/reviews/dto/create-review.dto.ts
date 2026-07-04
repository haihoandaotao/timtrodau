import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID lượt giữ chỗ (đã SUCCESS) để xác thực quyền đánh giá' })
  @IsString()
  bookingId: string;

  @ApiProperty({ example: 5, description: 'Số sao 1..5' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Chủ trọ thân thiện, phòng đúng mô tả.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
