import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccommodationStatus, BookingStatus, UserRole, UserStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Booking } from '../bookings/entities/booking.entity';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { UsersService } from '../users/users.service';
import { STORAGE_SERVICE, StorageService } from '../files/storage.interface';
import { Accommodation } from './entities/accommodation.entity';
import { Amenity } from './entities/amenity.entity';
import { Area } from './entities/area.entity';
import { Image } from './entities/image.entity';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { QueryAccommodationDto } from './dto/query-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';

export interface LandlordStats {
  publishedCount: number;
  totalViews: number;
  totalBookings: number;
  successBookings: number;
}

@Injectable()
export class AccommodationsService {
  constructor(
    @InjectRepository(Accommodation)
    private readonly accRepo: Repository<Accommodation>,
    @InjectRepository(Image) private readonly imageRepo: Repository<Image>,
    @InjectRepository(Amenity) private readonly amenityRepo: Repository<Amenity>,
    @InjectRepository(Area) private readonly areaRepo: Repository<Area>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    private readonly usersService: UsersService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /** Thống kê cho chủ trọ: bài đã duyệt, lượt tiếp cận, lượt giữ chỗ, đặt thành công. */
  async landlordStats(landlordId: string): Promise<LandlordStats> {
    const accs = await this.accRepo.find({ where: { landlordId } });
    const ids = accs.map((a) => a.id);
    const publishedCount = accs.filter((a) => a.status === AccommodationStatus.PUBLISHED).length;
    const totalViews = accs.reduce((sum, a) => sum + (a.views ?? 0), 0);
    let totalBookings = 0;
    let successBookings = 0;
    if (ids.length > 0) {
      [totalBookings, successBookings] = await Promise.all([
        this.bookingRepo.count({ where: { accommodationId: In(ids) } }),
        this.bookingRepo.count({
          where: { accommodationId: In(ids), status: BookingStatus.SUCCESS },
        }),
      ]);
    }
    return { publishedCount, totalViews, totalBookings, successBookings };
  }

  /** Xoá 1 ảnh của bài đăng (chỉ owner). */
  async removeImage(accId: string, imageId: string, userId: string): Promise<{ success: true }> {
    await this.findOwned(accId, userId);
    const img = await this.imageRepo.findOne({ where: { id: imageId, accommodationId: accId } });
    if (!img) {
      throw new NotFoundException('Không tìm thấy ảnh');
    }
    await this.imageRepo.delete(img.id);
    return { success: true };
  }

  // ===================== PUBLIC (Sinh viên) =====================

  /**
   * DAL-8: danh sách công khai + Smart Filter. CHỈ trả bài PUBLISHED (ẩn PENDING).
   * KHÔNG join landlord_profile → không lộ CCCD (T9-I1/T8-I1).
   */
  async findPublic(query: QueryAccommodationDto): Promise<Paginated<Accommodation>> {
    if (
      query.priceMin !== undefined &&
      query.priceMax !== undefined &&
      query.priceMin > query.priceMax
    ) {
      throw new BadRequestException('priceMin không được lớn hơn priceMax');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.accRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.images', 'img')
      .leftJoinAndSelect('a.area', 'area')
      .leftJoinAndSelect('a.amenities', 'am')
      .where('a.status = :status', { status: AccommodationStatus.PUBLISHED });

    if (query.keyword && query.keyword.trim()) {
      qb.andWhere('(a.title LIKE :kw OR a.address LIKE :kw)', {
        kw: `%${query.keyword.trim()}%`,
      });
    }
    if (query.areaId !== undefined) {
      qb.andWhere('a.area_id = :areaId', { areaId: query.areaId });
    }
    if (query.distanceMax !== undefined) {
      qb.andWhere('a.distance_km IS NOT NULL AND a.distance_km <= :dmax', {
        dmax: query.distanceMax,
      });
    }
    if (query.priceMin !== undefined) {
      qb.andWhere('a.price >= :pmin', { pmin: query.priceMin });
    }
    if (query.priceMax !== undefined) {
      qb.andWhere('a.price <= :pmax', { pmax: query.priceMax });
    }
    if (query.type !== undefined) {
      qb.andWhere('a.type = :type', { type: query.type });
    }
    // Lọc tiện ích: phải có ĐỦ tất cả tiện ích được chọn (AND).
    if (query.amenityIds && query.amenityIds.length > 0) {
      qb.andWhere(
        `a.id IN (
          SELECT aa.accommodation_id FROM accommodation_amenities aa
          WHERE aa.amenity_id IN (:...amIds)
          GROUP BY aa.accommodation_id
          HAVING COUNT(DISTINCT aa.amenity_id) = :amCount
        )`,
        { amIds: query.amenityIds, amCount: query.amenityIds.length },
      );
    }

    // Dùng property name (a.createdAt) — bắt buộc khi phân trang + join
    // collection để TypeORM map được column metadata (tránh lỗi databaseName).
    qb.orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * DAL-9: chi tiết phòng PUBLISHED. 404 nếu không tồn tại/chưa duyệt/đã xóa.
   * Trả kèm thông tin LIÊN HỆ chủ trọ (tên + SĐT) cho người thuê; KHÔNG lộ
   * CCCD (landlord_profile không được join) và password_hash bị loại bỏ.
   */
  async findPublicById(id: string): Promise<Accommodation> {
    const acc = await this.accRepo.findOne({
      where: { id, status: AccommodationStatus.PUBLISHED },
      relations: { images: true, area: true, amenities: true, landlord: true },
    });
    if (!acc) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    // Đếm lượt tiếp cận (người xem chi tiết).
    await this.accRepo.increment({ id: acc.id }, 'views', 1);
    acc.views = (acc.views ?? 0) + 1;
    if (acc.landlord) {
      // Loại field nhạy cảm; chỉ để lộ tên + SĐT liên hệ cho người thuê.
      acc.landlord.passwordHash = null;
    }
    return acc;
  }

  /** DAL-10: danh sách khu vực gợi ý. */
  listAreas(): Promise<Area[]> {
    return this.areaRepo.find({ order: { name: 'ASC' } });
  }

  /** Danh mục tiện ích. */
  listAmenities(): Promise<Amenity[]> {
    return this.amenityRepo.find({ order: { id: 'ASC' } });
  }

  // ===================== LANDLORD =====================

  /**
   * DAL-5: tạo bài đăng. Chỉ chủ trọ ĐÃ DUYỆT (ACTIVE) mới được đăng.
   * Nếu Admin bật "tự động duyệt" → PUBLISHED ngay; ngược lại → PENDING và
   * gửi email báo Admin có bài chờ duyệt.
   */
  async create(landlordId: string, dto: CreateAccommodationDto): Promise<Accommodation> {
    const landlord = await this.usersService.findById(landlordId);
    if (!landlord || landlord.role !== UserRole.LANDLORD) {
      throw new ForbiddenException('Chỉ chủ trọ mới được đăng tin');
    }
    if (landlord.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản chủ trọ chưa được duyệt');
    }

    const autoApprove = await this.settings.isAutoApprove();
    const acc = this.accRepo.create({
      landlordId,
      title: dto.title,
      description: dto.description ?? null,
      price: String(dto.price),
      type: dto.type,
      address: dto.address,
      areaId: dto.areaId ?? null,
      lat: dto.lat !== undefined ? String(dto.lat) : null,
      lng: dto.lng !== undefined ? String(dto.lng) : null,
      distanceKm: dto.distanceKm !== undefined ? String(dto.distanceKm) : null,
      extraCosts: dto.extraCosts ?? null,
      mapUrl: dto.mapUrl ?? null,
      isAvailable: true,
      status: autoApprove ? AccommodationStatus.PUBLISHED : AccommodationStatus.PENDING,
      amenities: await this.resolveAmenities(dto.amenityIds),
    });
    const created = await this.accRepo.save(acc);

    if (!autoApprove) {
      await this.notifyAdminNewListing(created, landlord.fullName);
    }
    return created;
  }

  /** Gửi email báo Admin có bài đăng mới chờ duyệt (lỗi email không chặn nghiệp vụ). */
  private async notifyAdminNewListing(acc: Accommodation, landlordName: string): Promise<void> {
    const to = this.mail.adminAddress();
    if (!to) return;
    const price = Number(acc.price).toLocaleString('vi-VN');
    await this.mail.send({
      to,
      subject: `[DAU] Bài đăng mới chờ duyệt: ${acc.title}`,
      text:
        `Có bài đăng mới chờ duyệt.\n\n` +
        `Tiêu đề: ${acc.title}\n` +
        `Chủ trọ: ${landlordName}\n` +
        `Giá: ${price} đ/tháng\n` +
        `Địa chỉ: ${acc.address}\n\n` +
        `Vào trang Kiểm duyệt để duyệt/từ chối bài.`,
      html:
        `<h3>Có bài đăng mới chờ duyệt</h3>` +
        `<ul>` +
        `<li><b>Tiêu đề:</b> ${acc.title}</li>` +
        `<li><b>Chủ trọ:</b> ${landlordName}</li>` +
        `<li><b>Giá:</b> ${price} đ/tháng</li>` +
        `<li><b>Địa chỉ:</b> ${acc.address}</li>` +
        `</ul>` +
        `<p>Vào trang <b>Kiểm duyệt</b> trong khu quản trị để xử lý.</p>`,
    });
  }

  /** Danh sách bài đăng của chủ trọ hiện tại. */
  findMine(landlordId: string): Promise<Accommodation[]> {
    return this.accRepo.find({
      where: { landlordId },
      relations: { images: true, amenities: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** DAL-5: sửa bài. Nếu sửa nội dung → đưa về PENDING để duyệt lại. */
  async update(id: string, userId: string, dto: UpdateAccommodationDto): Promise<Accommodation> {
    const acc = await this.findOwned(id, userId);

    Object.assign(acc, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { price: String(dto.price) }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.areaId !== undefined && { areaId: dto.areaId }),
      ...(dto.lat !== undefined && { lat: String(dto.lat) }),
      ...(dto.lng !== undefined && { lng: String(dto.lng) }),
      ...(dto.distanceKm !== undefined && { distanceKm: String(dto.distanceKm) }),
      ...(dto.extraCosts !== undefined && { extraCosts: dto.extraCosts }),
      ...(dto.mapUrl !== undefined && { mapUrl: dto.mapUrl }),
    });
    if (dto.amenityIds !== undefined) {
      acc.amenities = await this.resolveAmenities(dto.amenityIds);
    }
    // Sửa nội dung → cần duyệt lại.
    acc.status = AccommodationStatus.PENDING;
    return this.accRepo.save(acc);
  }

  /** DAL-6: toggle còn/hết phòng (chỉ owner). */
  async toggleAvailability(
    id: string,
    userId: string,
    isAvailable: boolean,
  ): Promise<Accommodation> {
    const acc = await this.findOwned(id, userId);
    acc.isAvailable = isAvailable;
    return this.accRepo.save(acc);
  }

  /** DAL-7: thêm ảnh/video (chỉ owner). sort_order tăng dần sau ảnh hiện có. */
  async addImages(
    id: string,
    userId: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string; size: number }>,
  ): Promise<Image[]> {
    const acc = await this.findOwned(id, userId);
    const existing = await this.imageRepo.count({
      where: { accommodationId: acc.id },
    });

    const saved: Image[] = [];
    let order = existing;
    for (const file of files) {
      const result = await this.storage.save({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
      const image = await this.imageRepo.save(
        this.imageRepo.create({
          accommodationId: acc.id,
          url: result.url,
          mediaType: result.mediaType,
          sortOrder: order++,
        }),
      );
      saved.push(image);
    }
    return saved;
  }

  /** Soft delete — owner hoặc admin. */
  async remove(id: string, user: AuthUser): Promise<void> {
    const acc = await this.accRepo.findOne({ where: { id } });
    if (!acc) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }
    if (acc.landlordId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xóa bài đăng này');
    }
    await this.accRepo.softRemove(acc);
  }

  /** Tìm bài đăng và xác thực quyền sở hữu. */
  private async findOwned(id: string, userId: string): Promise<Accommodation> {
    const acc = await this.accRepo.findOne({
      where: { id },
      relations: { amenities: true },
    });
    if (!acc) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }
    if (acc.landlordId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài đăng này');
    }
    return acc;
  }

  private async resolveAmenities(ids?: number[]): Promise<Amenity[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.amenityRepo.findBy({ id: In(ids) });
  }
}
