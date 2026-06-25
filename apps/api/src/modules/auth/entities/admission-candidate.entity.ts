import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Mock "hệ thống tuyển sinh" — thí sinh đã đăng ký xét tuyển.
 * Tân sinh viên đăng nhập bằng SBD + mật khẩu tài khoản thí sinh.
 * (Thực tế sẽ thay bằng tích hợp API tuyển sinh của trường.)
 */
@Entity('admission_candidates')
export class AdmissionCandidate {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index('uq_admission_sbd', { unique: true })
  @Column({ name: 'sbd', type: 'varchar', length: 32 })
  sbd: string; // số báo danh

  @Column({ name: 'full_name', type: 'varchar', length: 191 })
  fullName: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 191 })
  passwordHash: string;
}
