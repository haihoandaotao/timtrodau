import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RoommateGenderPref, RoommatePostStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Area } from '../../accommodations/entities/area.entity';
import { RoommatePostImage } from './roommate-post-image.entity';

/**
 * Tin "Tìm bạn ở ghép" — SV giới thiệu chỗ trọ đang ở + tìm người ghép.
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

  /** Tiền phòng / tháng (VND). */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget: string | null;

  /** Địa chỉ chỗ trọ đang ở. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  /** SĐT liên hệ trên tin. */
  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  /** Giới tính bạn ghép mong muốn. */
  @Column({
    name: 'gender_pref',
    type: 'enum',
    enum: RoommateGenderPref,
    default: RoommateGenderPref.ANY,
  })
  genderPref: RoommateGenderPref;

  @Column({ name: 'preferred_area_id', type: 'int', nullable: true })
  preferredAreaId: number | null;

  @ManyToOne(() => Area, { nullable: true })
  @JoinColumn({ name: 'preferred_area_id' })
  preferredArea: Area | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: RoommatePostStatus, default: RoommatePostStatus.OPEN })
  status: RoommatePostStatus;

  @OneToMany(() => RoommatePostImage, (img) => img.post)
  images?: RoommatePostImage[];
}
