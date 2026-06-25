import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Ngành nhập học — admin cấu hình, tân SV chọn từ danh sách (không tự điền). */
@Entity('majors')
export class Major {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('uq_majors_name', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
