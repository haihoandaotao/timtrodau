import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import sharp from 'sharp';
import { MediaType } from '../../common/enums';
import { SavedFile, StorageService, UploadInput } from './storage.interface';

/** Giới hạn dung lượng mỗi ảnh sau khi nén (2MB). */
const IMAGE_TARGET_BYTES = 2 * 1024 * 1024;
/** Cạnh dài tối đa của ảnh sau khi nén (giảm dung lượng + đủ nét hiển thị). */
const IMAGE_MAX_DIMENSION = 1920;

/**
 * LocalStorageService — lưu file vào thư mục UPLOAD_DIR, phục vụ static qua /uploads.
 * Validate mime + size theo cấu hình trước khi ghi (chống upload sai định dạng/quá lớn).
 * Ảnh được nén tự động xuống dưới 2MB (resize + giảm chất lượng JPEG dần).
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);

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
    const isImage = input.mimeType.startsWith('image/');

    if (isImage) {
      const { buffer, ext } = await this.compressImage(input.buffer);
      const fileName = `${randomUUID()}${ext}`;
      await fs.writeFile(join(this.uploadDir, fileName), buffer);
      return { url: `/uploads/${fileName}`, mediaType: MediaType.IMAGE };
    }

    // Video (hoặc media khác): lưu nguyên bản.
    const ext = extname(input.originalName) || this.extFromMime(input.mimeType);
    const fileName = `${randomUUID()}${ext}`;
    await fs.writeFile(join(this.uploadDir, fileName), input.buffer);
    return {
      url: `/uploads/${fileName}`,
      mediaType: input.mimeType.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE,
    };
  }

  /**
   * Nén ảnh xuống dưới 2MB: tự xoay theo EXIF, thu nhỏ về tối đa 1920px,
   * rồi encode JPEG giảm dần chất lượng cho tới khi đạt mục tiêu dung lượng.
   * Nếu sharp lỗi (file không phải ảnh hợp lệ) → ném BadRequest.
   */
  private async compressImage(input: Buffer): Promise<{ buffer: Buffer; ext: string }> {
    const pipeline = sharp(input, { failOn: 'none' }).rotate().resize({
      width: IMAGE_MAX_DIMENSION,
      height: IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });

    let output: Buffer | undefined;
    for (const quality of [82, 72, 62, 52, 42]) {
      try {
        output = await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
      } catch {
        throw new BadRequestException('Ảnh không hợp lệ hoặc không xử lý được');
      }
      if (output.length <= IMAGE_TARGET_BYTES) break;
    }
    if (!output) {
      throw new BadRequestException('Không xử lý được ảnh');
    }
    if (output.length > IMAGE_TARGET_BYTES) {
      this.logger.warn(
        `Ảnh vẫn ${(output.length / 1024 / 1024).toFixed(1)}MB sau khi nén ở mức thấp nhất.`,
      );
    }
    return { buffer: output, ext: '.jpg' };
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
