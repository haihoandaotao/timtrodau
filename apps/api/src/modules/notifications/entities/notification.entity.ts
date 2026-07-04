import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Thông báo trong ứng dụng gửi tới 1 người dùng (chuông TopBar). */
@Entity('notifications')
export class Notification extends BaseEntity {
  @Index('idx_notifications_user')
  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ type: 'varchar', length: 191 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  body: string | null;

  /** Đường dẫn nội bộ để bấm vào (vd /bookings, /landlord). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  link: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;
}
