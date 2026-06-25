import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { RoommatePostStatus } from '../../common/enums';
import { RoommatePost } from './entities/roommate-post.entity';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto';
import { QueryRoommateDto } from './dto/query-roommate.dto';
import { UpdateRoommatePostDto } from './dto/update-roommate-post.dto';

@Injectable()
export class RoommateService {
  constructor(
    @InjectRepository(RoommatePost)
    private readonly repo: Repository<RoommatePost>,
  ) {}

  /** DAL-12: tạo tin tìm bạn ở ghép. */
  create(studentId: string, dto: CreateRoommatePostDto): Promise<RoommatePost> {
    const post = this.repo.create({
      studentId,
      major: dto.major,
      budget: dto.budget !== undefined ? String(dto.budget) : null,
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
      relations: { preferredArea: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** Sửa/đóng tin — chỉ chủ tin. */
  async update(id: string, studentId: string, dto: UpdateRoommatePostDto): Promise<RoommatePost> {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin');
    }
    if (post.studentId !== studentId) {
      throw new ForbiddenException('Bạn không có quyền sửa tin này');
    }
    Object.assign(post, {
      ...(dto.major !== undefined && { major: dto.major }),
      ...(dto.budget !== undefined && { budget: String(dto.budget) }),
      ...(dto.preferredAreaId !== undefined && { preferredAreaId: dto.preferredAreaId }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.status !== undefined && { status: dto.status }),
    });
    return this.repo.save(post);
  }
}
