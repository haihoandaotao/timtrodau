import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AccommodationStatus, AccommodationType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Area } from './area.entity';
import { Amenity } from './amenity.entity';
import { Image } from './image.entity';

export interface ExtraCosts {
  electricity?: string;
  water?: string;
  sanitation?: string;
  internet?: string;
}

@Entity('accommodations')
export class Accommodation extends BaseEntity {
  @Column({ name: 'landlord_id', type: 'bigint' })
  landlordId: string;

  @ManyToOne(() => User, (u) => u.accommodations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'landlord_id' })
  landlord: User;

  @Column({ type: 'varchar', length: 191 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('idx_accommodations_price')
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string; // VND/tháng

  @Column({ type: 'enum', enum: AccommodationType })
  type: AccommodationType;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  // area_id là FK → MySQL tự tạo index, không khai báo @Index trùng.
  @Column({ name: 'area_id', type: 'int', nullable: true })
  areaId: number | null;

  @ManyToOne(() => Area, { nullable: true })
  @JoinColumn({ name: 'area_id' })
  area: Area | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: string | null;

  @Column({ name: 'distance_km', type: 'decimal', precision: 5, scale: 2, nullable: true })
  distanceKm: string | null; // khoảng cách tới trường

  @Column({ name: 'extra_costs', type: 'json', nullable: true })
  extraCosts: ExtraCosts | null;

  @Column({ name: 'map_url', type: 'varchar', length: 500, nullable: true })
  mapUrl: string | null; // link Google Maps do chủ trọ dán

  @Column({ type: 'int', default: 0 })
  views: number; // số lượt xem chi tiết (người tiếp cận)

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean; // toggle còn/hết phòng

  @Index('idx_accommodations_status')
  @Column({
    type: 'enum',
    enum: AccommodationStatus,
    default: AccommodationStatus.PENDING,
  })
  status: AccommodationStatus;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string | null;

  @OneToMany(() => Image, (img) => img.accommodation, { cascade: true })
  images?: Image[];

  @ManyToMany(() => Amenity)
  @JoinTable({
    name: 'accommodation_amenities',
    joinColumn: { name: 'accommodation_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
  })
  amenities?: Amenity[];
}
