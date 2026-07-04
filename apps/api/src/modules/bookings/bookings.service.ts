import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { BookingStatus, UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AccommodationsService } from '../accommodations/accommodations.service';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotifyService } from '../notify/notify.service';
import { UsersService } from '../users/users.service';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

/** Nhãn tiếng Việt cho trạng thái giữ chỗ (dùng trong email thông báo). */
const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Chờ xử lý',
  [BookingStatus.CONTACTED]: 'Đã liên hệ',
  [BookingStatus.SUCCESS]: 'Thành công',
  [BookingStatus.CANCELLED]: 'Đã huỷ',
};

export interface BookingContact {
  phone: string | null;
  zalo: string | null;
}

export interface BookingResult {
  booking: Booking;
  contact: BookingContact;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(LandlordProfile)
    private readonly landlordRepo: Repository<LandlordProfile>,
    private readonly accommodationsService: AccommodationsService,
    private readonly usersService: UsersService,
    private readonly notifyService: NotifyService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * DAL-11: SV giữ chỗ. Chỉ phòng PUBLISHED (findPublicById ném 404 nếu chưa duyệt)
   * và còn trống. Idempotent: nếu đã có booking đang xử lý cho phòng này → trả lại,
   * không tạo trùng. Gửi thông báo chủ trọ + trả contact để deep-link Zalo/SĐT.
   */
  async create(studentId: string, dto: CreateBookingDto): Promise<BookingResult> {
    const acc = await this.accommodationsService.findPublicById(dto.accommodationId);
    if (!acc.isAvailable) {
      throw new ConflictException('Phòng đã hết, không thể giữ chỗ');
    }

    // Chống duplicate: booking đang hoạt động (PENDING/CONTACTED) cho cùng phòng.
    const existing = await this.bookingRepo.findOne({
      where: {
        studentId,
        accommodationId: acc.id,
        status: In([BookingStatus.PENDING, BookingStatus.CONTACTED]),
      },
    });

    const booking =
      existing ??
      (await this.bookingRepo.save(
        this.bookingRepo.create({
          studentId,
          accommodationId: acc.id,
          status: BookingStatus.PENDING,
          note: dto.note ?? null,
        }),
      ));

    const landlord = await this.usersService.findById(acc.landlordId);
    const student = await this.usersService.findById(studentId);

    if (!existing && landlord) {
      await this.notifyService.notifyNewBooking({
        landlordPhone: landlord.phone ?? '',
        accommodationTitle: acc.title,
        studentName: student?.fullName ?? 'Sinh viên',
      });
      await this.notifications.notify(
        landlord.id,
        'Có lượt giữ chỗ mới',
        `${student?.fullName ?? 'Sinh viên'} vừa giữ chỗ phòng "${acc.title}"`,
        '/landlord',
      );
      // Email cho chủ trọ (nếu có email) khi có lượt giữ chỗ mới.
      if (landlord.email) {
        await this.mail.send({
          to: landlord.email,
          subject: `[DAU] Có lượt giữ chỗ mới: ${acc.title}`,
          text:
            `Chào ${landlord.fullName},\n\n` +
            `Sinh viên ${student?.fullName ?? ''} vừa giữ chỗ phòng "${acc.title}".\n` +
            `SĐT sinh viên: ${student?.phone ?? 'chưa cập nhật'}\n\n` +
            `Đăng nhập để liên hệ và cập nhật trạng thái.`,
          html:
            `<p>Chào <b>${landlord.fullName}</b>,</p>` +
            `<p>Sinh viên <b>${student?.fullName ?? ''}</b> vừa giữ chỗ phòng "<b>${acc.title}</b>".</p>` +
            `<p>SĐT sinh viên: ${student?.phone ?? 'chưa cập nhật'}</p>` +
            `<p>Đăng nhập để liên hệ và cập nhật trạng thái.</p>`,
        });
      }
    }

    return { booking, contact: this.buildContact(landlord?.phone ?? null) };
  }

  /** SV xem lịch sử giữ chỗ. */
  findMine(studentId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { studentId },
      relations: { accommodation: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ===================== ADMIN (DAL-14) =====================

  /** Admin xem toàn bộ booking, lọc theo status, phân trang. */
  async findAll(query: QueryBookingDto): Promise<Paginated<Booking>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: FindOptionsWhere<Booking> = {};
    if (query.status) {
      where.status = query.status;
    }
    const [data, total] = await this.bookingRepo.findAndCount({
      where,
      relations: { accommodation: true, student: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /** Chủ trọ: danh sách giữ chỗ của các phòng MÌNH đăng. */
  findForLandlord(landlordId: string): Promise<Booking[]> {
    return this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.accommodation', 'a')
      .leftJoinAndSelect('b.student', 's')
      .where('a.landlord_id = :landlordId', { landlordId })
      .orderBy('b.created_at', 'DESC')
      .getMany();
  }

  /**
   * Cập nhật trạng thái booking. Admin sửa bất kỳ; chủ trọ chỉ sửa booking
   * thuộc phòng mình. Khi chuyển SUCCESS (lần đầu) → tăng verified_booking_count.
   */
  async updateStatus(id: string, status: BookingStatus, user: AuthUser): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { accommodation: true },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking');
    }
    if (user.role !== UserRole.ADMIN && booking.accommodation?.landlordId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật booking này');
    }

    const becameSuccess =
      status === BookingStatus.SUCCESS && booking.status !== BookingStatus.SUCCESS;
    const changed = booking.status !== status;
    booking.status = status;
    const saved = await this.bookingRepo.save(booking);

    if (becameSuccess && booking.accommodation) {
      await this.landlordRepo.increment(
        { userId: booking.accommodation.landlordId },
        'verifiedBookingCount',
        1,
      );
    }

    // Báo sinh viên khi trạng thái giữ chỗ thay đổi.
    if (changed) {
      const student = await this.usersService.findById(booking.studentId);
      const title = booking.accommodation?.title ?? 'phòng đã giữ chỗ';
      const label = BOOKING_STATUS_LABEL[status] ?? status;
      await this.notifications.notify(
        booking.studentId,
        'Cập nhật lượt giữ chỗ',
        `Phòng "${title}" chuyển sang: ${label}`,
        '/bookings',
      );
      if (student?.email) {
        await this.mail.send({
          to: student.email,
          subject: `[DAU] Cập nhật giữ chỗ "${title}": ${label}`,
          text:
            `Chào ${student.fullName},\n\n` +
            `Trạng thái giữ chỗ phòng "${title}" của bạn đã chuyển sang: ${label}.\n\n` +
            `Đăng nhập để xem chi tiết.`,
          html:
            `<p>Chào <b>${student.fullName}</b>,</p>` +
            `<p>Trạng thái giữ chỗ phòng "<b>${title}</b>" của bạn đã chuyển sang: <b>${label}</b>.</p>` +
            `<p>Đăng nhập để xem chi tiết.</p>`,
        });
      }
    }
    return saved;
  }

  private buildContact(phone: string | null): BookingContact {
    return {
      phone,
      zalo: phone ? `https://zalo.me/${phone}` : null,
    };
  }
}
