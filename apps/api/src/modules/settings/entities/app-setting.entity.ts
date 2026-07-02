import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * AppSetting — cấu hình hệ thống dạng key-value, chỉnh được từ UI Admin
 * (không cần sửa .env / deploy lại). Ví dụ: cờ tự động duyệt bài.
 */
@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn({ name: 'setting_key', type: 'varchar', length: 100 })
  key: string;

  @Column({ name: 'setting_value', type: 'varchar', length: 255 })
  value: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
