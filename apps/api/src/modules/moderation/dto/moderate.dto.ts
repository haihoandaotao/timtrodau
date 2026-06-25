import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ModerateAccommodationDto {
  @ApiProperty({ enum: ModerationAction })
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @ApiPropertyOptional({ description: 'Lý do (BẮT BUỘC khi REJECT)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ModerateLandlordDto {
  @ApiProperty({ enum: ModerationAction })
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @ApiPropertyOptional({ description: 'Lý do (BẮT BUỘC khi REJECT)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Đánh dấu chủ trọ uy tín (chỉ khi APPROVE)' })
  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;
}
