/**
 * Unit test AuthService — mock toàn bộ phụ thuộc (KHÔNG cần MySQL).
 * Bao phủ đăng nhập/đăng ký sinh viên (tân SV + SV trường).
 */
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { StudentType, UserRole } from '../../common/enums';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const userRepo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: '1', ...x })),
  };
  const studentProfileRepo = {
    findOne: jest.fn(async () => null),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
  };
  const admissionRepo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: '1', ...x })),
  };
  const studentRecordRepo = { findOne: jest.fn() };
  const lockoutRepo = {
    findOne: jest.fn(async () => null),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
    delete: jest.fn(),
  };
  const usersService = {
    findByPhone: jest.fn(),
    findByEmail: jest.fn(),
    findByIdentifier: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn(async () => 'signed.jwt.token'), verifyAsync: jest.fn() };
  const config = { get: jest.fn(() => 'secret') };
  const admissionApi = { findByIdentifier: jest.fn(async () => null), upsert: jest.fn() };
  const mail = { send: jest.fn(async () => true), adminAddress: jest.fn(() => '') };
  const dataSource = { transaction: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userRepo as never,
      studentProfileRepo as never,
      admissionRepo as never,
      studentRecordRepo as never,
      lockoutRepo as never,
      usersService as never,
      jwtService as never,
      config as never,
      dataSource as never,
      admissionApi as never,
      mail as never,
    );
  });

  describe('prospectiveLogin (Tân SV)', () => {
    it('Happy: email + ngày sinh đúng → SV PROSPECTIVE + ngành dự kiến', async () => {
      admissionRepo.findOne.mockResolvedValue({
        email: 'tansinh@x.vn',
        phone: '0931000001',
        fullName: 'Trần Tân Sinh',
        dateOfBirth: '2007-05-12',
        intendedMajor: 'Kiến trúc',
      });
      userRepo.findOne.mockResolvedValue(null);

      const res = await service.prospectiveLogin({ identifier: 'tansinh@x.vn', dob: '2007-05-12' });

      expect(res.user.role).toBe(UserRole.STUDENT);
      expect(res.tokens.accessToken).toBeTruthy();
      const saved = studentProfileRepo.save.mock.calls[0][0];
      expect(saved.studentType).toBe(StudentType.PROSPECTIVE);
      expect(saved.intendedMajor).toBe('Kiến trúc');
    });

    it('Error: sai ngày sinh → Unauthorized', async () => {
      admissionRepo.findOne.mockResolvedValue({
        email: 'tansinh@x.vn',
        fullName: 'X',
        dateOfBirth: '2007-05-12',
      });
      await expect(
        service.prospectiveLogin({ identifier: 'tansinh@x.vn', dob: '2000-01-01' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('prospectiveRegister (tự đăng ký)', () => {
    it('Happy: chưa tồn tại → tạo candidate + đăng nhập', async () => {
      admissionRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);

      const res = await service.prospectiveRegister({
        fullName: 'Nguyễn Thí Sinh',
        email: 'moi@x.vn',
        dob: '2007-01-01',
        intendedMajor: 'Kiến trúc',
        enrollmentYear: 2026,
      });
      expect(res.user.role).toBe(UserRole.STUDENT);
      expect(admissionRepo.save).toHaveBeenCalled();
    });

    it('Error: email đã tồn tại → Conflict', async () => {
      admissionRepo.findOne.mockResolvedValue({ id: '1', email: 'moi@x.vn' });
      await expect(
        service.prospectiveRegister({
          fullName: 'X',
          email: 'moi@x.vn',
          dob: '2007-01-01',
          intendedMajor: 'A',
          enrollmentYear: 2026,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('khóa brute-force ngày sinh', () => {
    it('Định danh đang bị khóa → Forbidden (chưa kiểm tra ngày sinh)', async () => {
      lockoutRepo.findOne.mockResolvedValueOnce({
        identifier: 'x@x.vn',
        failedAttempts: 0,
        lockedUntil: new Date(Date.now() + 60_000),
      } as never);
      await expect(
        service.prospectiveLogin({ identifier: 'x@x.vn', dob: '2007-01-01' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Sai ngày sinh → ghi nhận thất bại (recordLoginFailure)', async () => {
      admissionRepo.findOne.mockResolvedValue({
        email: 'a@x.vn',
        fullName: 'A',
        dateOfBirth: '2007-05-12',
      });
      await expect(
        service.prospectiveLogin({ identifier: 'a@x.vn', dob: '2000-01-01' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(lockoutRepo.save).toHaveBeenCalled();
    });
  });

  describe('studentLogin (SV trường)', () => {
    it('Happy: MSSV + ngày sinh đúng → tạo SV CURRENT', async () => {
      studentRecordRepo.findOne.mockResolvedValue({
        studentCode: '2021120001',
        fullName: 'Nguyễn Văn Kiến',
        major: 'Kiến trúc',
        dateOfBirth: '2003-05-12',
      });
      userRepo.findOne.mockResolvedValue(null);

      const res = await service.studentLogin({ studentCode: '2021120001', dob: '2003-05-12' });
      expect(res.user.role).toBe(UserRole.STUDENT);
      const saved = studentProfileRepo.save.mock.calls[0][0];
      expect(saved.studentType).toBe(StudentType.CURRENT);
    });

    it('Error: sai ngày sinh → Unauthorized', async () => {
      studentRecordRepo.findOne.mockResolvedValue({
        studentCode: '2021120001',
        fullName: 'X',
        dateOfBirth: '2003-05-12',
      });
      await expect(
        service.studentLogin({ studentCode: '2021120001', dob: '2000-01-01' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
