import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly favRepo: Repository<Favorite>,
    @InjectRepository(Accommodation) private readonly accRepo: Repository<Accommodation>,
  ) {}

  /** Thêm yêu thích (idempotent). */
  async add(userId: string, accommodationId: string): Promise<{ success: true }> {
    const exists = await this.favRepo.findOne({ where: { userId, accommodationId } });
    if (!exists) {
      await this.favRepo.save(this.favRepo.create({ userId, accommodationId }));
    }
    return { success: true };
  }

  async remove(userId: string, accommodationId: string): Promise<{ success: true }> {
    await this.favRepo.delete({ userId, accommodationId });
    return { success: true };
  }

  /** Danh sách phòng đã lưu (kèm thông tin phòng). */
  async list(userId: string): Promise<Accommodation[]> {
    const favs = await this.favRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    if (favs.length === 0) return [];
    return this.accRepo.find({
      where: { id: In(favs.map((f) => f.accommodationId)) },
      relations: { images: true, area: true },
    });
  }

  /** ID phòng đã lưu (để FE tô tim). */
  async listIds(userId: string): Promise<string[]> {
    const favs = await this.favRepo.find({ where: { userId } });
    return favs.map((f) => f.accommodationId);
  }
}
