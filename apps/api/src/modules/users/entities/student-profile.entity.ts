import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StudentType } from '../../../common/enums';
import { User } from './user.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @OneToOne(() => User, (u) => u.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  major: string | null; // ngành học — dùng cho "tìm bạn ở ghép"

  @Column({
    name: 'student_type',
    type: 'enum',
    enum: StudentType,
    default: StudentType.CURRENT,
  })
  studentType: StudentType;

  @Column({ name: 'intended_major', type: 'varchar', length: 100, nullable: true })
  intendedMajor: string | null; // ngành dự kiến (tân sinh viên)

  @Column({ name: 'enrollment_year', type: 'smallint', nullable: true })
  enrollmentYear: number | null;
}
