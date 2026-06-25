import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RoommatePostStatus } from '../../../common/enums';
import { CreateRoommatePostDto } from './create-roommate-post.dto';

export class UpdateRoommatePostDto extends PartialType(CreateRoommatePostDto) {
  @ApiPropertyOptional({ enum: RoommatePostStatus, description: 'Đóng/mở tin' })
  @IsOptional()
  @IsEnum(RoommatePostStatus)
  status?: RoommatePostStatus;
}
