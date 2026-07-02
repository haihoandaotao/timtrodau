import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { RoommatePostStatus } from '../../common/enums';
import { STORAGE_SERVICE, StorageService } from '../files/storage.interface';
import { RoommatePost } from './entities/roommate-post.entity';
import { RoommatePostImage } from './entities/roommate-post-image.entity';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto';
import { QueryRoommateDto } from './dto/query-roommate.dto';
import { UpdateRoommatePostDto } from './dto/update-roommate-post.dto';

@Injectable()
export class RoommateService {
  constructor(
    @InjectRepository(RoommatePost)
    private readonly repo: Repository<RoommatePost>,
    @InjectRepository(RoommatePostImage)
    private readonly imageRepo: Repository<RoommatePostImage>,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /** DAL-12: tạo tin tìm bạn ở ghép (SV giới thiệu chỗ trọ đang ở). */
  create(studentId: string, dto: CreateRoommatePostDto): Promise<RoommatePost> {
    const post = this.repo.create({
      studentId,
      major: dto.major,
      budget: dto.budget !== undefined ? String(dto.budget) : null,
      address: dto.address ?? null,
      contactPhone: dto.contactPhone ?? null,
      genderPref: dto.genderPref,
      preferredAreaId: dto.preferredAreaId ?? null,
      description: dto.description ?? null,
      status: RoommatePostStatus.OPEN,
    });
    return this.repo.save(post);
  }

  /** DAL-12: danh sách tin OPEN, lọc theo ngành/khu vực/ngân sách. */
  findAll(query: QueryRoommateDto): Promise<RoommatePost[]> {
    const where: FindOptionsWhere<RoommatePost> = { status: RoommatePostStatus.OPEN };
    if (query.major) {
      where.major = query.major;
    }
    if (query.areaId !== undefined) {
      where.preferredAreaId = query.areaId;
    }
    if (query.budgetMax !== undefined) {
      where.budget = LessThanOrEqual(String(query.budgetMax));
    }
    return this.repo.find({
      where,
      relations: { preferredArea: true, images: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** Sửa/đóng tin — chỉ chủ tin. */
  async update(id: string, studentId: string, dto: UpdateRoommatePostDto): Promise<RoommatePost> {
    const post = await this.findOwned(id, studentId);
    Object.assign(post, {
      ...(dto.major !== undefined && { major: dto.major }),
      ...(dto.budget !== undefined && { budget: String(dto.budget) }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
      ...(dto.genderPref !== undefined && { genderPref: dto.genderPref }),
      ...(dto.preferredAreaId !== undefined && { preferredAreaId: dto.preferredAreaId }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.status !== undefined && { status: dto.status }),
    });
    return this.repo.save(post);
  }

  /** Thêm ảnh căn hộ cho tin (chỉ chủ tin). Ảnh tự nén < 2MB. */
  async addImages(
    id: string,
    studentId: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string; size: number }>,
  ): Promise<RoommatePostImage[]> {
    await this.findOwned(id, studentId);
    const existing = await this.imageRepo.count({ where: { postId: id } });
    const saved: RoommatePostImage[] = [];
    let order = existing;
    for (const file of files) {
      const result = await this.storage.save({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
      saved.push(
        await this.imageRepo.save(
          this.imageRepo.create({ postId: id, url: result.url, sortOrder: order++ }),
        ),
      );
    }
    return saved;
  }

  /** Xoá 1 ảnh của tin (chỉ chủ tin). */
  async removeImage(id: string, imageId: string, studentId: string): Promise<{ success: true }> {
    await this.findOwned(id, studentId);
    const img = await this.imageRepo.findOne({ where: { id: imageId, postId: id } });
    if (!img) {
      throw new NotFoundException('Không tìm thấy ảnh');
    }
    await this.imageRepo.delete(img.id);
    return { success: true };
  }

  private async findOwned(id: string, studentId: string): Promise<RoommatePost> {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin');
    }
    if (post.studentId !== studentId) {
      throw new ForbiddenException('Bạn không có quyền sửa tin này');
    }
    return post;
  }
}
