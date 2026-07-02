import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateModerationSettingsDto {
  @ApiProperty({ description: 'Bật tự động duyệt bài (true) hoặc duyệt thủ công (false)' })
  @IsBoolean()
  autoApprove: boolean;
}
