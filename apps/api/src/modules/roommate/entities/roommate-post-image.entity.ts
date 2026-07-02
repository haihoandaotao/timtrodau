import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RoommatePost } from './roommate-post.entity';

/** Ảnh căn hộ/phòng kèm theo tin tìm bạn ở ghép. */
@Entity('roommate_post_images')
export class RoommatePostImage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'post_id', type: 'bigint' })
  postId: string;

  @ManyToOne(() => RoommatePost, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: RoommatePost;

  @Column({ type: 'varchar', length: 255 })
  url: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;
}
