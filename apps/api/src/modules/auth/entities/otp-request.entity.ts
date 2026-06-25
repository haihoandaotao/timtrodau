import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Lưu yêu cầu OTP đăng nhập SV. code_hash = hash của mã OTP (không lưu plaintext).
 */
@Entity('otp_requests')
export class OtpRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'student_code', type: 'varchar', length: 32 })
  studentCode: string;

  @Index('idx_otp_requests_phone')
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 191 })
  codeHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  consumed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
