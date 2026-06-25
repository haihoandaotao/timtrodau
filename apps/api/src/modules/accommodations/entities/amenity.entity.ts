import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Tiện ích (WIFI, AIRCON, FREE_HOURS, MEZZANINE, WASHER…). Bảng tra cứu (seed).
 */
@Entity('amenities')
export class Amenity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;
}
