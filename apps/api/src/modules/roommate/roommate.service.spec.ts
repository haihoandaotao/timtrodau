/**
 * Unit test RoommateService (DAL-12) — mock (KHÔNG cần MySQL).
 */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoommatePostStatus } from '../../common/enums';
import { RoommateService } from './roommate.service';

describe('RoommateService', () => {
  let service: RoommateService;

  const repo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: '1', ...x })),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };
  const imageRepo = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const storage = { save: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoommateService(repo as never, imageRepo as never, storage as never);
  });

  describe('create (DAL-12)', () => {
    it('T12-H1 (Happy): tạo tin OPEN gắn studentId + major', async () => {
      const res = await service.create('S1', {
        major: 'Kiến trúc',
        address: 'Hòa Xuân',
        contactPhone: '0905123456',
        budget: 2000000,
      });
      expect(res.studentId).toBe('S1'); // T12-I1
      expect(res.major).toBe('Kiến trúc');
      expect(res.status).toBe(RoommatePostStatus.OPEN);
    });
  });

  describe('findAll (DAL-12)', () => {
    it('T12-H1: lọc theo ngành → where.major + status OPEN, trả phân trang', async () => {
      repo.findAndCount.mockResolvedValue([[{ id: '1', major: 'Kiến trúc' }], 1]);
      const res = await service.findAll({ major: 'Kiến trúc' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            major: 'Kiến trúc',
            status: RoommatePostStatus.OPEN,
          }),
        }),
      );
      expect(res.meta.total).toBe(1);
      expect(res.data).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('T12-X2 (Error): không phải chủ tin → Forbidden', async () => {
      repo.findOne.mockResolvedValue({ id: '1', studentId: 'OTHER' });
      await expect(
        service.update('1', 'S1', { status: RoommatePostStatus.CLOSED }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Error: tin không tồn tại → NotFound', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('404', 'S1', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Happy: chủ tin đóng tin', async () => {
      repo.findOne.mockResolvedValue({ id: '1', studentId: 'S1' });
      const res = await service.update('1', 'S1', { status: RoommatePostStatus.CLOSED });
      expect(res.status).toBe(RoommatePostStatus.CLOSED);
    });
  });
});
