import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../accommodations/entities/area.entity';

@Injectable()
export class AreasService {
  constructor(@InjectRepository(Area) private readonly repo: Repository<Area>) {}

  listAll(): Promise<Area[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(name: string): Promise<Area> {
    const exists = await this.repo.findOne({ where: { name } });
    if (exists) {
      throw new ConflictException('Phường/xã đã tồn tại');
    }
    return this.repo.save(this.repo.create({ name }));
  }

  async update(id: number, name: string): Promise<Area> {
    const area = await this.repo.findOne({ where: { id } });
    if (!area) {
      throw new NotFoundException('Không tìm thấy phường/xã');
    }
    area.name = name;
    return this.repo.save(area);
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) {
      throw new NotFoundException('Không tìm thấy phường/xã');
    }
  }
}
