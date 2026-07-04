import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Đánh giá chủ trọ do sinh viên viết SAU KHI giữ chỗ thành công (SUCCESS).
 * Mỗi SV chỉ đánh giá 1 lần cho mỗi chủ trọ (ràng buộc unique).
 */
@Entity('landlord_reviews')
@Unique('uq_landlord_review_student_landlord', ['studentId', 'landlordId'])
export class LandlordReview extends BaseEntity {
  @Index('idx_landlord_reviews_landlord')
  @Column({ name: 'landlord_id', type: 'bigint' })
  landlordId: string;

  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @Column({ name: 'booking_id', type: 'bigint' })
  bookingId: string;

  @Column({ type: 'smallint' })
  rating: number; // 1..5

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
