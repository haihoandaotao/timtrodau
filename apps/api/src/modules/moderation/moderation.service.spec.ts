/**
 * Unit test ModerationService (DAL-13) — mock (KHÔNG cần MySQL).
 */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccommodationStatus, UserStatus, VerifyStatus } from '../../common/enums';
import { ModerationService } from './moderation.service';
import { ModerationAction } from './dto/moderate.dto';

describe('ModerationService', () => {
  let service: ModerationService;

  const accRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(async (x) => x) };
  const landlordRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(async (x) => x) };
  const userRepo = { findOne: jest.fn(), save: jest.fn(async (x) => x) };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService(accRepo as never, landlordRepo as never, userRepo as never);
  });

  describe('moderateAccommodation (DAL-13)', () => {
    it('T13-H1 (Happy): APPROVE → PUBLISHED, xóa reason', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', status: AccommodationStatus.PENDING });
      const res = await service.moderateAccommodation('1', { action: ModerationAction.APPROVE });
      expect(res.status).toBe(AccommodationStatus.PUBLISHED);
      expect(res.rejectReason).toBeNull();
    });

    it('T13-E2 (Edge): REJECT có reason → REJECTED + lưu reason', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', status: AccommodationStatus.PENDING });
      const res = await service.moderateAccommodation('1', {
        action: ModerationAction.REJECT,
        reason: 'Ảnh không rõ ràng',
      });
      expect(res.status).toBe(AccommodationStatus.REJECTED);
      expect(res.rejectReason).toBe('Ảnh không rõ ràng');
    });

    it('T13-X1 (Error): REJECT không reason → BadRequest', async () => {
      accRepo.findOne.mockResolvedValue({ id: '1', status: AccommodationStatus.PENDING });
      await expect(
        service.moderateAccommodation('1', { action: ModerationAction.REJECT }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('Error: bài không tồn tại → NotFound', async () => {
      accRepo.findOne.mockResolvedValue(null);
      await expect(
        service.moderateAccommodation('404', { action: ModerationAction.APPROVE }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('moderateLandlord (DAL-13)', () => {
    it('Happy: APPROVE → verify APPROVED + user ACTIVE + isTrusted', async () => {
      landlordRepo.findOne.mockResolvedValue({ userId: 'L1', verifyStatus: VerifyStatus.PENDING });
      userRepo.findOne.mockResolvedValue({ id: 'L1', status: UserStatus.PENDING });
      const res = await service.moderateLandlord('L1', {
        action: ModerationAction.APPROVE,
        isTrusted: true,
      });
      expect(res.verifyStatus).toBe(VerifyStatus.APPROVED);
      expect(res.isTrusted).toBe(true);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: UserStatus.ACTIVE }),
      );
    });

    it('Error: REJECT không reason → BadRequest', async () => {
      landlordRepo.findOne.mockResolvedValue({ userId: 'L1', verifyStatus: VerifyStatus.PENDING });
      userRepo.findOne.mockResolvedValue({ id: 'L1', status: UserStatus.PENDING });
      await expect(
        service.moderateLandlord('L1', { action: ModerationAction.REJECT }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
