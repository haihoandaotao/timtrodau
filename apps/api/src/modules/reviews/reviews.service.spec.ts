/**
 * Unit test ReviewsService — mock repos (KHÔNG cần MySQL).
 * Quy tắc: chỉ đánh giá sau khi giữ chỗ SUCCESS, mỗi SV 1 lần/chủ trọ.
 */
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../../common/enums';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const reviewRepo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 'r1', ...x })),
  };
  const bookingRepo = { findOne: jest.fn() };
  const accRepo = { findOne: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReviewsService(reviewRepo as never, bookingRepo as never, accRepo as never);
  });

  const successBooking = {
    id: 'b1',
    studentId: 'S1',
    status: BookingStatus.SUCCESS,
    accommodation: { landlordId: 'L1' },
  };

  describe('create', () => {
    it('Happy: booking SUCCESS của mình + chưa đánh giá → lưu review gắn đúng chủ trọ', async () => {
      bookingRepo.findOne.mockResolvedValue(successBooking);
      reviewRepo.findOne.mockResolvedValue(null);
      const res = await service.create('S1', { bookingId: 'b1', rating: 5, comment: 'Tốt' });
      expect(res.landlordId).toBe('L1');
      expect(res.studentId).toBe('S1');
      expect(res.rating).toBe(5);
      expect(reviewRepo.save).toHaveBeenCalledTimes(1);
    });

    it('Error: không phải booking của mình → NotFound', async () => {
      bookingRepo.findOne.mockResolvedValue({ ...successBooking, studentId: 'OTHER' });
      await expect(service.create('S1', { bookingId: 'b1', rating: 5 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('Error: booking chưa SUCCESS → Forbidden', async () => {
      bookingRepo.findOne.mockResolvedValue({ ...successBooking, status: BookingStatus.PENDING });
      await expect(service.create('S1', { bookingId: 'b1', rating: 4 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('Error: đã đánh giá chủ trọ này → Conflict', async () => {
      bookingRepo.findOne.mockResolvedValue(successBooking);
      reviewRepo.findOne.mockResolvedValue({ id: 'r0' });
      await expect(service.create('S1', { bookingId: 'b1', rating: 3 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('byAccommodation', () => {
    it('Error: phòng không tồn tại → NotFound', async () => {
      accRepo.findOne.mockResolvedValue(null);
      await expect(service.byAccommodation('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
