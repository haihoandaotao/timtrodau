import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThan, Repository } from 'typeorm';
import {
  AccommodationStatus,
  AccommodationType,
  BookingStatus,
  StudentType,
  VerifyStatus,
} from '../../common/enums';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { StudentProfile } from '../users/entities/student-profile.entity';

const PRICE_LOW = 1_500_000;
const PRICE_HIGH = 2_500_000;

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Accommodation) private readonly accRepo: Repository<Accommodation>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(LandlordProfile)
    private readonly landlordRepo: Repository<LandlordProfile>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepo: Repository<StudentProfile>,
  ) {}

  /** Số tân sinh viên đã đăng ký theo từng ngành dự kiến. */
  async prospectiveByMajor(): Promise<Array<{ major: string; count: number }>> {
    const rows = await this.studentProfileRepo
      .createQueryBuilder('sp')
      .select('COALESCE(sp.intended_major, :unknown)', 'major')
      .addSelect('COUNT(sp.id)', 'count')
      .where('sp.student_type = :t', { t: StudentType.PROSPECTIVE })
      .setParameter('unknown', 'Chưa rõ')
      .groupBy('sp.intended_major')
      .orderBy('count', 'DESC')
      .getRawMany<{ major: string; count: string }>();
    return rows.map((r) => ({ major: r.major, count: Number(r.count) }));
  }

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

  /** Trang chủ công khai: số liệu tổng quan theo loại hình + tổng lượt đăng ký. */
  async publicOverview(): Promise<{
    totalRooms: number;
    traditional: number;
    miniApt: number;
    shared: number;
    totalRegistrations: number;
  }> {
    const base = { status: AccommodationStatus.PUBLISHED };
    const [totalRooms, traditional, miniApt, shared, totalRegistrations] = await Promise.all([
      this.accRepo.count({ where: base }),
      this.accRepo.count({ where: { ...base, type: AccommodationType.TRADITIONAL } }),
      this.accRepo.count({ where: { ...base, type: AccommodationType.MINI_APT } }),
      this.accRepo.count({ where: { ...base, type: AccommodationType.SHARED } }),
      this.bookingRepo.count(),
    ]);
    return { totalRooms, traditional, miniApt, shared, totalRegistrations };
  }

  /** Trang chủ công khai: phòng nổi bật (còn trống, mới nhất). */
  featured(limit = 6): Promise<Accommodation[]> {
    return this.accRepo.find({
      where: { status: AccommodationStatus.PUBLISHED, isAvailable: true },
      relations: { images: true, area: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
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
