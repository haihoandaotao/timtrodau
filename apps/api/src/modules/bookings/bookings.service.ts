import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BookingStatus } from '../../common/enums';
import { AccommodationsService } from '../accommodations/accommodations.service';
import { NotifyService } from '../notify/notify.service';
import { UsersService } from '../users/users.service';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

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
    private readonly accommodationsService: AccommodationsService,
    private readonly usersService: UsersService,
    private readonly notifyService: NotifyService,
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
        landlordPhone: landlord.phone,
        accommodationTitle: acc.title,
        studentName: student?.fullName ?? 'Sinh viên',
      });
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

  private buildContact(phone: string | null): BookingContact {
    return {
      phone,
      zalo: phone ? `https://zalo.me/${phone}` : null,
    };
  }
}
