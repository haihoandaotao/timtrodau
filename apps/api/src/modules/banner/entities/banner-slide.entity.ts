import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * BannerSlide — 1 slide của banner trang chủ (khách chưa đăng nhập).
 * Admin chỉnh sửa trực tiếp từ UI; carousel công khai đọc các slide đang bật.
 */
@Entity('banner_slides')
export class BannerSlide {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** Dòng nhãn nhỏ phía trên tiêu đề (vd "Đại học Kiến trúc Đà Nẵng"). */
  @Column({ name: 'header_label', type: 'varchar', length: 191, nullable: true })
  headerLabel: string | null;

  @Column({ type: 'varchar', length: 191 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  /** Ảnh nền (đường dẫn /uploads/...). Không có → dùng gradient. */
  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
