import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Khu vực gợi ý (Hòa Xuân, Khuê Trung, Hòa Cường Nam…). Bảng tra cứu (seed).
 */
@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'center_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLat: string | null;

  @Column({ name: 'center_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLng: string | null;
}
