/**
 * Unit test AuthService — mock toàn bộ phụ thuộc (KHÔNG cần MySQL).
 * Map test-case: DAL-2 (OTP), DAL-3 (đăng ký chủ trọ).
 */
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { StudentType, UserRole, UserStatus } from '../../common/enums';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  // --- mocks ---
  const otpRepo = { create: jest.fn((x) => x), save: jest.fn(), findOne: jest.fn() };
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
  const usersService = {
    findByPhone: jest.fn(),
    findOrCreateStudent: jest.fn(),
  };
  const otpService = {
    generateCode: jest.fn(() => '123456'),
    send: jest.fn(async () => true),
    ttlSeconds: 300,
  };
  const jwtService = { signAsync: jest.fn(async () => 'signed.jwt.token'), verifyAsync: jest.fn() };
  const config = { get: jest.fn(() => 'secret') };
  const dataSource = {
    transaction: jest.fn(async (cb) =>
      cb({
        create: (_e: unknown, x: unknown) => x,
        save: async (x: unknown) => ({ id: '99', ...(x as object) }),
      }),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      otpRepo as never,
      userRepo as never,
      studentProfileRepo as never,
      admissionRepo as never,
      studentRecordRepo as never,
      usersService as never,
      otpService as never,
      jwtService as never,
      config as never,
      dataSource as never,
    );
  });

  describe('requestOtp (DAL-2 T2-H1, T2-I1)', () => {
    it('sinh OTP, lưu request, gọi provider gửi đúng phone', async () => {
      otpRepo.save.mockResolvedValue({ id: '7' });
      const res = await service.requestOtp({ studentCode: '2024110001', phone: '0905123456' });

      expect(res.requestId).toBe('7');
      expect(otpService.generateCode).toHaveBeenCalledTimes(1);
      expect(otpService.send).toHaveBeenCalledWith('0905123456', '123456'); // T2-I1
      expect(otpRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyOtp', () => {
    const baseOtp = {
      id: '7',
      studentCode: '2024110001',
      phone: '0905123456',
      consumed: false,
      expiresAt: new Date(Date.now() + 60_000),
      codeHash: '',
    };

    it('T2-H1 (Happy): OTP đúng → cấp token + user STUDENT', async () => {
      const otp = { ...baseOtp, codeHash: await bcrypt.hash('123456', 10) };
      otpRepo.findOne.mockResolvedValue(otp);
      otpRepo.save.mockResolvedValue(otp);
      usersService.findOrCreateStudent.mockResolvedValue({
        id: '1',
        fullName: 'SV 2024110001',
        phone: '0905123456',
        email: null,
        studentCode: '2024110001',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      });

      const res = await service.verifyOtp({ requestId: '7', code: '123456' });

      expect(res.user.role).toBe(UserRole.STUDENT);
      expect(res.tokens.accessToken).toBeTruthy();
      expect(res.tokens.refreshToken).toBeTruthy();
      expect(otp.consumed).toBe(true); // đã đánh dấu dùng
    });

    it('T2-X1 (Error): OTP sai → BadRequest', async () => {
      otpRepo.findOne.mockResolvedValue({
        ...baseOtp,
        codeHash: await bcrypt.hash('999999', 10),
      });
      await expect(service.verifyOtp({ requestId: '7', code: '123456' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('T2-X2 (Error): OTP hết hạn → BadRequest', async () => {
      otpRepo.findOne.mockResolvedValue({
        ...baseOtp,
        expiresAt: new Date(Date.now() - 1000),
        codeHash: await bcrypt.hash('123456', 10),
      });
      await expect(service.verifyOtp({ requestId: '7', code: '123456' })).rejects.toThrow(
        /hết hạn/,
      );
    });

    it('T2-X3 (Error): OTP đã dùng → BadRequest', async () => {
      otpRepo.findOne.mockResolvedValue({ ...baseOtp, consumed: true });
      await expect(service.verifyOtp({ requestId: '7', code: '123456' })).rejects.toThrow(
        /đã được sử dụng/,
      );
    });

    it('Edge: requestId không tồn tại → BadRequest', async () => {
      otpRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyOtp({ requestId: 'x', code: '123456' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
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
        }),
      ).rejects.toBeInstanceOf(ConflictException);
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

  describe('registerLandlord (DAL-3)', () => {
    const dto = {
      fullName: 'Nguyễn Văn A',
      phone: '0905123456',
      password: 'MatKhau@123',
      idCardNo: '048201001234',
      address: '123 Hòa Xuân',
    };

    it('T3-H1 (Happy): tạo LANDLORD status=PENDING', async () => {
      usersService.findByPhone.mockResolvedValue(null);
      const res = await service.registerLandlord(dto);

      expect(res.role).toBe(UserRole.LANDLORD);
      expect(res.status).toBe(UserStatus.PENDING);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1); // T3-I1: trong transaction
    });

    it('T3-X2 (Error): SĐT trùng → Conflict', async () => {
      usersService.findByPhone.mockResolvedValue({ id: '1' });
      await expect(service.registerLandlord(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
