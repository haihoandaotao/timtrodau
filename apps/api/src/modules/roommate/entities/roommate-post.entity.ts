import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RoommatePostStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Area } from '../../accommodations/entities/area.entity';

/**
 * Tin "Tìm bạn ở ghép" — lọc theo ngành (major) để SV cùng ngành dễ ghép.
 */
@Entity('roommate_posts')
export class RoommatePost extends BaseEntity {
  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Index('idx_roommate_posts_major')
  @Column({ type: 'varchar', length: 100 })
  major: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget: string | null;

  @Column({ name: 'preferred_area_id', type: 'int', nullable: true })
  preferredAreaId: number | null;

  @ManyToOne(() => Area, { nullable: true })
  @JoinColumn({ name: 'preferred_area_id' })
  preferredArea: Area | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: RoommatePostStatus, default: RoommatePostStatus.OPEN })
  status: RoommatePostStatus;
}
