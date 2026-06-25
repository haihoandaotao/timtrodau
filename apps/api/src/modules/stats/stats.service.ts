import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThan, Repository } from 'typeorm';
import { AccommodationStatus, BookingStatus, VerifyStatus } from '../../common/enums';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';

const PRICE_LOW = 1_500_000;
const PRICE_HIGH = 2_500_000;

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Accommodation) private readonly accRepo: Repository<Accommodation>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(LandlordProfile)
    private readonly landlordRepo: Repository<LandlordProfile>,
  ) {}

  /** DAL-15: số liệu tổng quan. */
  async overview(): Promise<{
    studentsFoundRoom: number;
    publishedAccommodations: number;
    totalBookings: number;
  }> {
    const raw = await this.bookingRepo
      .createQueryBuilder('b')
      .select('COUNT(DISTINCT b.student_id)', 'c')
      .where('b.status = :s', { s: BookingStatus.SUCCESS })
      .getRawOne<{ c: string }>();

    const [publishedAccommodations, totalBookings] = await Promise.all([
      this.accRepo.count({ where: { status: AccommodationStatus.PUBLISHED } }),
      this.bookingRepo.count(),
    ]);

    return {
      studentsFoundRoom: Number(raw?.c ?? 0),
      publishedAccommodations,
      totalBookings,
    };
  }

  /** DAL-15: phân bố theo khoảng giá (chỉ phòng PUBLISHED). */
  async priceDistribution(): Promise<Array<{ bucket: string; count: number }>> {
    const base = { status: AccommodationStatus.PUBLISHED };
    const [under, mid, over] = await Promise.all([
      this.accRepo.count({ where: { ...base, price: LessThan(String(PRICE_LOW)) } }),
      this.accRepo.count({
        where: { ...base, price: Between(String(PRICE_LOW), String(PRICE_HIGH)) },
      }),
      this.accRepo.count({ where: { ...base, price: MoreThan(String(PRICE_HIGH)) } }),
    ]);
    return [
      { bucket: 'Dưới 1.5tr', count: under },
      { bucket: '1.5 - 2.5tr', count: mid },
      { bucket: 'Trên 2.5tr', count: over },
    ];
  }

  /** DAL-15: phân bố booking theo khu vực (khu vực được chọn nhiều nhất). */
  async areaDistribution(): Promise<Array<{ area: string; count: number }>> {
    const rows = await this.bookingRepo
      .createQueryBuilder('b')
      .leftJoin('b.accommodation', 'a')
      .leftJoin('a.area', 'area')
      .select('COALESCE(area.name, :unknown)', 'area')
      .addSelect('COUNT(b.id)', 'count')
      .setParameter('unknown', 'Khác')
      .groupBy('area.id')
      .orderBy('count', 'DESC')
      .getRawMany<{ area: string; count: string }>();
    return rows.map((r) => ({ area: r.area, count: Number(r.count) }));
  }

  /** DAL-15: danh sách chủ trọ uy tín (đã duyệt) — KHÔNG trả CCCD. */
  async trustedLandlords(): Promise<
    Array<{ userId: string; fullName: string; isTrusted: boolean; verifiedBookingCount: number }>
  > {
    const profiles = await this.landlordRepo.find({
      where: { verifyStatus: VerifyStatus.APPROVED },
      relations: { user: true },
      order: { isTrusted: 'DESC', verifiedBookingCount: 'DESC' },
      take: 10,
    });
    return profiles.map((p) => ({
      userId: p.userId,
      fullName: p.user?.fullName ?? '',
      isTrusted: p.isTrusted,
      verifiedBookingCount: p.verifiedBookingCount,
    }));
  }
}
