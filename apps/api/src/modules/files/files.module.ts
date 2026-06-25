import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { STORAGE_SERVICE } from './storage.interface';

/**
 * FilesModule — cung cấp StorageService (MVP: local). Đổi sang cloud chỉ cần
 * thay provider gắn vào STORAGE_SERVICE, không sửa nơi sử dụng.
 */
@Module({
  providers: [LocalStorageService, { provide: STORAGE_SERVICE, useExisting: LocalStorageService }],
  exports: [STORAGE_SERVICE],
})
export class FilesModule {}
