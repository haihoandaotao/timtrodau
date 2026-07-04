import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingStatus } from '../../common/enums';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { LandlordReview } from './entities/landlord-review.entity';

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  studentName: string;
  createdAt: Date;
}
export interface LandlordReviewSummary {
  average: number;
  count: number;
  items: ReviewItem[];
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(LandlordReview) private readonly repo: Repository<LandlordReview>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Accommodation) private readonly accRepo: Repository<Accommodation>,
  ) {}

  /** SV đánh giá chủ trọ — chỉ khi có lượt giữ chỗ SUCCESS với chủ trọ đó. */
  async create(studentId: string, dto: CreateReviewDto): Promise<LandlordReview> {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: { accommodation: true },
    });
    if (!booking || booking.studentId !== studentId) {
      throw new NotFoundException('Không tìm thấy lượt giữ chỗ');
    }
    if (booking.status !== BookingStatus.SUCCESS) {
      throw new ForbiddenException('Chỉ được đánh giá sau khi giữ chỗ thành công');
    }
    const landlordId = booking.accommodation?.landlordId;
    if (!landlordId) {
      throw new NotFoundException('Không xác định được chủ trọ');
    }
    const existing = await this.repo.findOne({ where: { studentId, landlordId } });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá chủ trọ này rồi');
    }
    return this.repo.save(
      this.repo.create({
        landlordId,
        studentId,
        bookingId: booking.id,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      }),
    );
  }

  /** Điểm trung bình + danh sách đánh giá của chủ trọ (theo phòng đang xem). */
  async byAccommodation(accId: string): Promise<LandlordReviewSummary> {
    const acc = await this.accRepo.findOne({ where: { id: accId } });
    if (!acc) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    return this.byLandlord(acc.landlordId);
  }

  private async byLandlord(landlordId: string): Promise<LandlordReviewSummary> {
    const agg = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.landlord_id = :lid', { lid: landlordId })
      .getRawOne<{ avg: string | null; cnt: string }>();

    const rows = await this.repo
      .createQueryBuilder('r')
      .leftJoin(User, 'u', 'u.id = r.student_id')
      .select('r.id', 'id')
      .addSelect('r.rating', 'rating')
      .addSelect('r.comment', 'comment')
      .addSelect('r.created_at', 'createdAt')
      .addSelect('u.full_name', 'studentName')
      .where('r.landlord_id = :lid', { lid: landlordId })
      .orderBy('r.created_at', 'DESC')
      .limit(50)
      .getRawMany<{
        id: string;
        rating: number;
        comment: string | null;
        createdAt: Date;
        studentName: string | null;
      }>();

    return {
      average: agg?.avg ? Math.round(Number(agg.avg) * 10) / 10 : 0,
      count: Number(agg?.cnt ?? 0),
      items: rows.map((r) => ({
        id: r.id,
        rating: Number(r.rating),
        comment: r.comment,
        studentName: r.studentName ?? 'Sinh viên',
        createdAt: r.createdAt,
      })),
    };
  }
}
