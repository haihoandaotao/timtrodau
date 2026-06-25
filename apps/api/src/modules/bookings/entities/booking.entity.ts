import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Accommodation } from '../../accommodations/entities/accommodation.entity';

@Entity('bookings')
export class Booking extends BaseEntity {
  @Index('idx_bookings_student_id')
  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @ManyToOne(() => User, (u) => u.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Index('idx_bookings_accommodation_id')
  @Column({ name: 'accommodation_id', type: 'bigint' })
  accommodationId: string;

  @ManyToOne(() => Accommodation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accommodation_id' })
  accommodation: Accommodation;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
