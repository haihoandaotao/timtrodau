import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Đếm số lần đăng nhập sai theo ĐỊNH DANH (email/SĐT/MSSV) cho luồng đăng nhập
 * bằng ngày sinh — chống dò ngày sinh (không gian nhỏ). Khóa tạm khi vượt ngưỡng.
 */
@Entity('login_lockouts')
export class LoginLockout {
  @PrimaryColumn({ type: 'varchar', length: 191 })
  identifier: string;

  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
