import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { STORAGE_SERVICE, StorageService } from '../files/storage.interface';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { BannerSlide } from './entities/banner-slide.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(BannerSlide) private readonly repo: Repository<BannerSlide>,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /** Slide công khai cho carousel — chỉ slide đang bật, theo thứ tự. */
  listPublic(): Promise<BannerSlide[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /** Toàn bộ slide (Admin). */
  listAll(): Promise<BannerSlide[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async create(dto: CreateBannerDto): Promise<BannerSlide> {
    // Slide mới xếp cuối nếu không chỉ định thứ tự.
    const max = await this.repo
      .createQueryBuilder('b')
      .select('MAX(b.sort_order)', 'max')
      .getRawOne<{ max: number | null }>();
    return this.repo.save(
      this.repo.create({
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        headerLabel: dto.headerLabel ?? null,
        sortOrder: dto.sortOrder ?? Number(max?.max ?? 0) + 1,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(id: string, dto: UpdateBannerDto): Promise<BannerSlide> {
    const slide = await this.findOr404(id);
    if (dto.title !== undefined) slide.title = dto.title;
    if (dto.subtitle !== undefined) slide.subtitle = dto.subtitle || null;
    if (dto.headerLabel !== undefined) slide.headerLabel = dto.headerLabel || null;
    if (dto.sortOrder !== undefined) slide.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) slide.isActive = dto.isActive;
    return this.repo.save(slide);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const slide = await this.findOr404(id);
    await this.repo.remove(slide);
    return { deleted: true };
  }

  /** Tải ảnh nền cho slide (ảnh tự nén < 2MB qua StorageService). */
  async setImage(
    id: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ): Promise<BannerSlide> {
    const slide = await this.findOr404(id);
    const saved = await this.storage.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    slide.imageUrl = saved.url;
    return this.repo.save(slide);
  }

  private async findOr404(id: string): Promise<BannerSlide> {
    const slide = await this.repo.findOne({ where: { id } });
    if (!slide) {
      throw new NotFoundException('Không tìm thấy slide');
    }
    return slide;
  }
}
