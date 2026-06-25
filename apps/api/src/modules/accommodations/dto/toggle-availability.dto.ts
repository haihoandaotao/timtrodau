import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleAvailabilityDto {
  @ApiProperty({ example: false, description: 'true = còn phòng, false = hết phòng' })
  @IsBoolean()
  isAvailable: boolean;
}
