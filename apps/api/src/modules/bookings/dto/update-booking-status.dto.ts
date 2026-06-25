import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '../../../common/enums';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONTACTED })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
