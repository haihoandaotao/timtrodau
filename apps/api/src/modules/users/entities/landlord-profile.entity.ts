import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { VerifyStatus } from '../../../common/enums';
import { User } from './user.entity';

/**
 * Hồ sơ chủ trọ — chứa dữ liệu nhạy cảm (CCCD).
 * Quy tắc bảo mật: id_card_no / id_card_image_url CHỈ Admin được xem,
 * không bao giờ trả về API công khai.
 */
@Entity('landlord_profiles')
export class LandlordProfile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @OneToOne(() => User, (u) => u.landlordProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'id_card_no', type: 'varchar', length: 20 })
  idCardNo: string; // CCCD

  @Column({ name: 'id_card_image_url', type: 'varchar', length: 255, nullable: true })
  idCardImageUrl: string | null;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ name: 'is_trusted', type: 'boolean', default: false })
  isTrusted: boolean; // cờ uy tín do Admin set

  @Column({ name: 'verified_booking_count', type: 'int', default: 0 })
  verifiedBookingCount: number;

  @Column({
    name: 'verify_status',
    type: 'enum',
    enum: VerifyStatus,
    default: VerifyStatus.PENDING,
  })
  verifyStatus: VerifyStatus;
}
