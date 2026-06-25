/**
 * Unit test BookingsService (DAL-11) — mock (KHÔNG cần MySQL).
 */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../../common/enums';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;

  const bookingRepo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: '100', ...x })),
    find: jest.fn(),
  };
  const landlordRepo = { increment: jest.fn() };
  const accommodationsService = { findPublicById: jest.fn() };
  const usersService = { findById: jest.fn() };
  const notifyService = { notifyNewBooking: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingsService(
      bookingRepo as never,
      landlordRepo as never,
      accommodationsService as never,
      usersService as never,
      notifyService as never,
    );
    usersService.findById.mockImplementation(async (id: string) =>
      id === 'L1'
        ? { id: 'L1', phone: '0905123456', fullName: 'Chủ trọ A' }
        : { id, phone: '0900000001', fullName: 'SV B' },
    );
  });

  const acc = { id: '1', landlordId: 'L1', title: 'Phòng A', isAvailable: true };

  describe('create (DAL-11)', () => {
    it('T11-H1 (Happy): phòng còn trống → booking PENDING + contact + notify', async () => {
      accommodationsService.findPublicById.mockResolvedValue(acc);
      bookingRepo.findOne.mockResolvedValue(null);

      const res = await service.create('S1', { accommodationId: '1' });

      expect(res.booking.status).toBe(BookingStatus.PENDING);
      expect(res.contact.phone).toBe('0905123456');
      expect(res.contact.zalo).toBe('https://zalo.me/0905123456');
      expect(notifyService.notifyNewBooking).toHaveBeenCalledTimes(1); // T11-I1
    });

    it('T11-E2 (Edge): đã có booking đang xử lý → trả lại, không tạo trùng', async () => {
      accommodationsService.findPublicById.mockResolvedValue(acc);
      bookingRepo.findOne.mockResolvedValue({ id: '99', status: BookingStatus.PENDING });

      const res = await service.create('S1', { accommodationId: '1' });

      expect(res.booking.id).toBe('99');
      expect(bookingRepo.save).not.toHaveBeenCalled(); // không tạo mới
      expect(notifyService.notifyNewBooking).not.toHaveBeenCalled(); // không spam notify
    });

    it('T11-X1 (Error): phòng hết (isAvailable=false) → Conflict', async () => {
      accommodationsService.findPublicById.mockResolvedValue({ ...acc, isAvailable: false });
      await expect(service.create('S1', { accommodationId: '1' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('T11-X2 (Error): phòng chưa PUBLISHED → NotFound (propagate)', async () => {
      accommodationsService.findPublicById.mockRejectedValue(new NotFoundException());
      await expect(service.create('S1', { accommodationId: '404' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findMine', () => {
    it('trả lịch sử booking của SV', async () => {
      bookingRepo.find.mockResolvedValue([{ id: '1' }]);
      const res = await service.findMine('S1');
      expect(res).toHaveLength(1);
      expect(bookingRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 'S1' } }),
      );
    });
  });

  describe('updateStatus (DAL-14)', () => {
    it('T14-E2 (Edge): chuyển SUCCESS → tăng verified_booking_count chủ trọ', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: '1',
        status: BookingStatus.CONTACTED,
        accommodation: { landlordId: 'L1' },
      });
      await service.updateStatus('1', BookingStatus.SUCCESS);
      expect(landlordRepo.increment).toHaveBeenCalledWith(
        { userId: 'L1' },
        'verifiedBookingCount',
        1,
      );
    });

    it('Edge: SUCCESS → SUCCESS lần nữa không tăng trùng', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: '1',
        status: BookingStatus.SUCCESS,
        accommodation: { landlordId: 'L1' },
      });
      await service.updateStatus('1', BookingStatus.SUCCESS);
      expect(landlordRepo.increment).not.toHaveBeenCalled();
    });

    it('Error: booking không tồn tại → NotFound', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStatus('404', BookingStatus.SUCCESS)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
