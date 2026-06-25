import { MediaType } from '../../common/enums';

/** Trừu tượng hóa lưu trữ media. MVP: local; có thể swap S3/Cloudinary sau. */
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface SavedFile {
  url: string;
  mediaType: MediaType;
}

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StorageService {
  /** Lưu file, trả URL truy cập. Ném lỗi nếu mime/size không hợp lệ. */
  save(input: UploadInput): Promise<SavedFile>;
}
