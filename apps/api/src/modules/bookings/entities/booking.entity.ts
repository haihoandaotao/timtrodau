import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Accommodation } from '../../accommodations/entities/accommodation.entity';

@Entity('bookings')
export class Booking extends BaseEntity {
  // student_id là FK → MySQL tự tạo index, không khai báo @Index trùng.
  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @ManyToOne(() => User, (u) => u.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  // accommodation_id là FK → MySQL tự tạo index, không khai báo @Index trùng.
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
