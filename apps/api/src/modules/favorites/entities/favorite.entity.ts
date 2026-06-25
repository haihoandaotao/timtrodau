import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Phòng yêu thích của sinh viên. */
@Entity('favorites')
@Index('uq_favorite_user_acc', ['userId', 'accommodationId'], { unique: true })
export class Favorite {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'accommodation_id', type: 'bigint' })
  accommodationId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
