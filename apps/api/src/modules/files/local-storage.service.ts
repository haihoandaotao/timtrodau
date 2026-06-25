import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { MediaType } from '../../common/enums';
import { SavedFile, StorageService, UploadInput } from './storage.interface';

/**
 * LocalStorageService — lưu file vào thư mục UPLOAD_DIR, phục vụ static qua /uploads.
 * Validate mime + size theo cấu hình trước khi ghi (chống upload sai định dạng/quá lớn).
 */
@Injectable()
export class LocalStorageService implements StorageService {
  constructor(private readonly config: ConfigService) {}

  private get uploadDir(): string {
    return this.config.get<string>('storage.uploadDir') ?? 'uploads';
  }

  private get maxSizeBytes(): number {
    return (this.config.get<number>('storage.maxSizeMb') ?? 10) * 1024 * 1024;
  }

  private get allowedMime(): string[] {
    return (
      this.config.get<string[]>('storage.allowedMime') ?? [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
      ]
    );
  }

  async save(input: UploadInput): Promise<SavedFile> {
    if (!this.allowedMime.includes(input.mimeType)) {
      throw new BadRequestException(`Định dạng không hỗ trợ: ${input.mimeType}`);
    }
    if (input.size > this.maxSizeBytes) {
      throw new BadRequestException('File vượt quá dung lượng cho phép');
    }

    await fs.mkdir(this.uploadDir, { recursive: true });
    const ext = extname(input.originalName) || this.extFromMime(input.mimeType);
    const fileName = `${randomUUID()}${ext}`;
    await fs.writeFile(join(this.uploadDir, fileName), input.buffer);

    return {
      url: `/uploads/${fileName}`,
      mediaType: input.mimeType.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE,
    };
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
    };
    return map[mime] ?? '';
  }
}
