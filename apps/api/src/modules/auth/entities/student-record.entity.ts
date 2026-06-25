import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Mock "hệ thống quản lý sinh viên" — sinh viên đang học của trường.
 * SV trường đăng nhập bằng MSSV + mật khẩu là NGÀY SINH (yyyy-mm-dd).
 * (Thực tế sẽ thay bằng tích hợp API quản lý đào tạo.)
 */
@Entity('student_records')
export class StudentRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index('uq_student_record_code', { unique: true })
  @Column({ name: 'student_code', type: 'varchar', length: 32 })
  studentCode: string;

  @Column({ name: 'full_name', type: 'varchar', length: 191 })
  fullName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  major: string | null;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string; // yyyy-mm-dd
}
