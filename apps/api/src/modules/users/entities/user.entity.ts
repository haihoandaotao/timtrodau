import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole, UserStatus } from '../../../common/enums';
import { StudentProfile } from './student-profile.entity';
import { LandlordProfile } from './landlord-profile.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index('idx_users_student_code')
  @Column({ name: 'student_code', type: 'varchar', length: 32, nullable: true, unique: true })
  studentCode: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 191 })
  fullName: string;

  @Index('idx_users_phone')
  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 191, nullable: true })
  email: string | null;

  // Băm bằng bcrypt — chỉ dùng cho LANDLORD/ADMIN; STUDENT đăng nhập bằng OTP.
  @Column({ name: 'password_hash', type: 'varchar', length: 191, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @OneToOne(() => StudentProfile, (p) => p.user)
  studentProfile?: StudentProfile;

  @OneToOne(() => LandlordProfile, (p) => p.user)
  landlordProfile?: LandlordProfile;

  @OneToMany('Accommodation', 'landlord')
  accommodations?: unknown[];

  @OneToMany('Booking', 'student')
  bookings?: unknown[];
}
