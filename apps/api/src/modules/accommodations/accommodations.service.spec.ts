/**
 * Unit test AccommodationsService — mock repos/storage (KHÔNG cần MySQL).
 * Map: DAL-5 (CRUD), DAL-6 (toggle), DAL-7 (upload).
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccommodationStatus, AccommodationType, UserRole, UserStatus } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { AccommodationsService } from './accommodations.service';

describe('AccommodationsService', () => {
  let service: AccommodationsService;

  const accRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: '1', ...x })),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    softRemove: jest.fn(),
    increment: jest.fn(),
  };
  const bookingRepo = { count: jest.fn() };
  const imageRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: '10', ...x })),
    count: jest.fn(async () => 0),
  };
  const amenityRepo = { findBy: jest.fn(async () => []), find: jest.fn(async () => []) };
  const areaRepo = { find: jest.fn(async () => []) };
  const usersService = { findById: jest.fn() };
  const settings = { isAutoApprove: jest.fn(async () => false) };
  const mail = { adminAddress: jest.fn(() => ''), send: jest.fn(async () => true) };
  const storage = { save: jest.fn(async () => ({ url: '/uploads/x.jpg', mediaType: 'IMAGE' })) };

  // QueryBuilder giả lập chuỗi method.
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (accRepo as Record<string, unknown>).createQueryBuilder = jest.fn(() => qb);
    service = new AccommodationsService(
      accRepo as never,
      imageRepo as never,
      amenityRepo as never,
      areaRepo as never,
      bookingRepo as never,
      usersService as never,
      settings as never,
      mail as never,
      storage as never,
    );
  });

  const dto = {
    title: 'Phòng Hòa Xuân',
    price: 2000000,
    type: AccommodationType.TRADITIONAL,
    address: '123 Hòa Xuân',
  };

  describe('findPublic (DAL-8)', () => {
    it('T8-H1 (Happy): trả phân trang + chỉ lọc status PUBLISHED', async () => {
      qb.getManyAndCount.mockResolvedValue([[{ id: '1' }], 1]);
      const res = await service.findPublic({ page: 1, limit: 20, priceMax: 1500000 });

      expect(res.meta.total).toBe(1);
      expect(res.meta.totalPages).toBe(1);
      // T8-I1: luôn lọc PUBLISHED (ẩn PENDING)
      expect(qb.where).toHaveBeenCalledWith('a.status = :status', {
        status: AccommodationStatus.PUBLISHED,
      });
    });

    it('T8-E2 (Edge): không khớp → data rỗng, total=0', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      const res = await service.findPublic({ page: 1, limit: 20 });
      expect(res.data).toHaveLength(0);
      expect(res.meta.total).toBe(0);
    });

    it('T8-X1 (Error): priceMin > priceMax → BadRequest', async () => {
      await expect(
        service.findPublic({ priceMin: 3000000, priceMax: 1000000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findPublicById (DAL-9)', () => {
    it('T9-H1 (Happy): trả phòng PUBLISHED kèm media/area/amenities', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', status: AccommodationStatus.PUBLISHED });
      const res = await service.findPublicById('1');
      expect(res.id).toBe('1');
      // T9-I1: chỉ join images/area/amenities — KHÔNG join landlord_profile (không lộ CCCD)
      expect(accRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1', status: AccommodationStatus.PUBLISHED },
        relations: { images: true, area: true, amenities: true, landlord: true },
      });
    });

    it('T9-X1/X2 (Error): không tồn tại/chưa duyệt/đã xóa → NotFound', async () => {
      accRepo.findOne.mockResolvedValue(null);
      await expect(service.findPublicById('404')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create (DAL-5)', () => {
    it('T5-H1 (Happy): chủ trọ ACTIVE tạo bài → status PENDING', async () => {
      usersService.findById.mockResolvedValue({
        id: '5',
        role: UserRole.LANDLORD,
        status: UserStatus.ACTIVE,
        phone: '0905123456',
      });
      const res = await service.create('5', dto);

      expect(res.status).toBe(AccommodationStatus.PENDING);
      expect(res.landlordId).toBe('5'); // T5-I1: gắn đúng owner
      expect(res.isAvailable).toBe(true);
      expect(accRepo.save).toHaveBeenCalledTimes(1);
    });

    it('T5-X2 (Error): chủ trọ chưa duyệt (PENDING) → Forbidden', async () => {
      usersService.findById.mockResolvedValue({
        id: '5',
        role: UserRole.LANDLORD,
        status: UserStatus.PENDING,
      });
      await expect(service.create('5', dto)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('toggleAvailability (DAL-6)', () => {
    it('T6-H1 (Happy): owner toggle false', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', landlordId: '5', isAvailable: true });
      const res = await service.toggleAvailability('1', '5', false);
      expect(res.isAvailable).toBe(false);
    });

    it('T6-X1 (Error): non-owner toggle → Forbidden', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', landlordId: '999', isAvailable: true });
      await expect(service.toggleAvailability('1', '5', false)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('T6-X2 (Error): id không tồn tại → NotFound', async () => {
      accRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleAvailability('404', '5', false)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('addImages (DAL-7)', () => {
    const file = {
      buffer: Buffer.from('x'),
      originalname: 'a.jpg',
      mimetype: 'image/jpeg',
      size: 10,
    };

    it('T7-H1 + T7-I1 (Happy/Integration): lưu qua StorageService, sort_order tăng', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', landlordId: '5' });
      imageRepo.count.mockResolvedValue(2); // đã có 2 ảnh
      const res = await service.addImages('1', '5', [file, file]);

      expect(storage.save).toHaveBeenCalledTimes(2); // T7-I1
      expect(res[0].sortOrder).toBe(2);
      expect(res[1].sortOrder).toBe(3);
    });

    it('T7 (Error): non-owner upload → Forbidden', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', landlordId: '999' });
      await expect(service.addImages('1', '5', [file])).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove', () => {
    const admin: AuthUser = { id: '7', role: UserRole.ADMIN, phone: '0' };
    const owner: AuthUser = { id: '5', role: UserRole.LANDLORD, phone: '0' };
    const other: AuthUser = { id: '8', role: UserRole.LANDLORD, phone: '0' };

    it('Happy: owner xóa được', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', landlordId: '5' });
      await service.remove('1', owner);
      expect(accRepo.softRemove).toHaveBeenCalledTimes(1);
    });

    it('Happy: admin xóa được bài người khác', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', landlordId: '5' });
      await service.remove('1', admin);
      expect(accRepo.softRemove).toHaveBeenCalledTimes(1);
    });

    it('Error: chủ trọ khác xóa → Forbidden', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', landlordId: '5' });
      await expect(service.remove('1', other)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
