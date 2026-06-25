import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MediaType } from '../../../common/enums';
import { Accommodation } from './accommodation.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'accommodation_id', type: 'bigint' })
  accommodationId: string;

  @ManyToOne(() => Accommodation, (a) => a.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accommodation_id' })
  accommodation: Accommodation;

  @Column({ type: 'varchar', length: 255 })
  url: string;

  @Column({ name: 'media_type', type: 'enum', enum: MediaType, default: MediaType.IMAGE })
  mediaType: MediaType;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;
}
