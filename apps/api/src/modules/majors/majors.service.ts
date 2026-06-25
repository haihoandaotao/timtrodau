import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Major } from './entities/major.entity';

@Injectable()
export class MajorsService {
  constructor(@InjectRepository(Major) private readonly repo: Repository<Major>) {}

  /** Ngành đang bật — cho tân SV chọn (dropdown). */
  listActive(): Promise<Major[]> {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  listAll(): Promise<Major[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(name: string): Promise<Major> {
    const exists = await this.repo.findOne({ where: { name } });
    if (exists) {
      throw new ConflictException('Ngành đã tồn tại');
    }
    return this.repo.save(this.repo.create({ name, isActive: true }));
  }

  async update(id: number, data: { name?: string; isActive?: boolean }): Promise<Major> {
    const major = await this.repo.findOne({ where: { id } });
    if (!major) {
      throw new NotFoundException('Không tìm thấy ngành');
    }
    if (data.name !== undefined) major.name = data.name;
    if (data.isActive !== undefined) major.isActive = data.isActive;
    return this.repo.save(major);
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) {
      throw new NotFoundException('Không tìm thấy ngành');
    }
  }
}
