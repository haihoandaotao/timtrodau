import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Mock "hệ thống tuyển sinh" — thí sinh/tân sinh viên.
 * Đăng nhập: email HOẶC SĐT + mật khẩu là NGÀY SINH (yyyy-mm-dd).
 * Thí sinh chưa có trong hệ thống có thể tự đăng ký (is_self_registered=true).
 */
@Entity('admission_candidates')
export class AdmissionCandidate {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 191 })
  fullName: string;

  @Index('uq_admission_email', { unique: true })
  @Column({ type: 'varchar', length: 191, nullable: true })
  email: string | null;

  @Index('uq_admission_phone', { unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string; // yyyy-mm-dd — dùng làm mật khẩu

  @Column({ name: 'intended_major', type: 'varchar', length: 100, nullable: true })
  intendedMajor: string | null;

  @Column({ name: 'is_self_registered', type: 'boolean', default: false })
  isSelfRegistered: boolean;
}
