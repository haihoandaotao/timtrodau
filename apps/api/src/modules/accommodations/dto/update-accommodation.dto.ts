import { PartialType } from '@nestjs/swagger';
import { CreateAccommodationDto } from './create-accommodation.dto';

/** Sửa bài đăng — tất cả field optional. Sửa nội dung sẽ đưa bài về PENDING (duyệt lại). */
export class UpdateAccommodationDto extends PartialType(CreateAccommodationDto) {}
