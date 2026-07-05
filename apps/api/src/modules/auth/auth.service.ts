import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { DataSource, Repository } from 'typeorm';
import { StudentType, UserRole, UserStatus, VerifyStatus } from '../../common/enums';
import { AuthUser, JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AdmissionApiService } from '../admission/admission-api.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { UsersService } from '../users/users.service';
import { AdmissionCandidate } from './entities/admission-candidate.entity';
import { StudentRecord } from './entities/student-record.entity';
import { LoginLockout } from './entities/login-lockout.entity';
import { LoginDto } from './dto/login.dto';
import { ProspectiveLoginDto } from './dto/prospective-login.dto';
import { ProspectiveRegisterDto } from './dto/prospective-register.dto';
import { StudentLoginDto } from './dto/student-login.dto';

/** Khóa tài khoản sau ngần này lần đăng nhập sai, trong ngần này thời gian. */
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
/** Khóa luồng đăng nhập bằng ngày sinh (theo định danh) khi sai quá nhiều lần. */
const DOB_MAX_ATTEMPTS = 6;
const DOB_LOCK_MS = 15 * 60 * 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  studentCode: string | null;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepo: Repository<StudentProfile>,
    @InjectRepository(AdmissionCandidate)
    private readonly admissionRepo: Repository<AdmissionCandidate>,
    @InjectRepository(StudentRecord)
    private readonly studentRecordRepo: Repository<StudentRecord>,
    @InjectRepository(LoginLockout)
    private readonly lockoutRepo: Repository<LoginLockout>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly admissionApi: AdmissionApiService,
    private readonly mail: MailService,
  ) {}

  // ---------- SV: đăng nhập theo đối tượng (mock hệ thống ngoài) ----------

  /** Chặn nếu định danh đang bị khóa do sai ngày sinh quá nhiều lần. */
  private async assertNotLocked(identifier: string): Promise<void> {
    const row = await this.lockoutRepo.findOne({ where: { identifier } });
    if (row?.lockedUntil && row.lockedUntil.getTime() > Date.now()) {
      throw new ForbiddenException('Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.');
    }
  }

  /** Ghi nhận 1 lần đăng nhập sai; vượt ngưỡng thì khóa tạm định danh. */
  private async recordLoginFailure(identifier: string): Promise<void> {
    let row = await this.lockoutRepo.findOne({ where: { identifier } });
    if (!row) row = this.lockoutRepo.create({ identifier, failedAttempts: 0, lockedUntil: null });
    row.failedAttempts += 1;
    if (row.failedAttempts >= DOB_MAX_ATTEMPTS) {
      row.lockedUntil = new Date(Date.now() + DOB_LOCK_MS);
      row.failedAttempts = 0;
    }
    await this.lockoutRepo.save(row);
  }

  /** Xoá bộ đếm sau khi đăng nhập thành công. */
  private async clearLoginFailure(identifier: string): Promise<void> {
    await this.lockoutRepo.delete({ identifier });
  }

  /**
   * Tân sinh viên: đăng nhập bằng email/SĐT + ngày sinh (mật khẩu).
   * Ưu tiên DB cục bộ (đã sync/mock); nếu không có → tra cứu trực tiếp API tuyển sinh.
   */
  async prospectiveLogin(
    dto: ProspectiveLoginDto,
  ): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    await this.assertNotLocked(dto.identifier);
    const local = await this.admissionRepo.findOne({
      where: [{ email: dto.identifier }, { phone: dto.identifier }],
    });
    let resolved: {
      email: string | null;
      phone: string | null;
      fullName: string;
      dob: string | null;
      intendedMajor: string | null;
    } | null = local
      ? {
          email: local.email,
          phone: local.phone,
          fullName: local.fullName,
          dob: String(local.dateOfBirth).slice(0, 10),
          intendedMajor: local.intendedMajor,
        }
      : null;

    if (!resolved) {
      const remote = await this.admissionApi.findByIdentifier(dto.identifier);
      if (remote) {
        await this.admissionApi.upsert(remote); // cache về DB cục bộ
        resolved = remote;
      }
    }

    if (!resolved || resolved.dob !== dto.dob) {
      await this.recordLoginFailure(dto.identifier);
      throw new UnauthorizedException('Sai email/SĐT hoặc ngày sinh');
    }
    await this.clearLoginFailure(dto.identifier);
    const user = await this.upsertStudent(
      { email: resolved.email, phone: resolved.phone },
      resolved.fullName,
      { studentType: StudentType.PROSPECTIVE, intendedMajor: resolved.intendedMajor ?? undefined },
    );
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  /** Thí sinh tự đăng ký (chưa có trong hệ thống tuyển sinh) → đăng nhập luôn. */
  async prospectiveRegister(
    dto: ProspectiveRegisterDto,
  ): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const dup = await this.admissionRepo.findOne({
      where: [
        ...(dto.email ? [{ email: dto.email }] : []),
        ...(dto.phone ? [{ phone: dto.phone }] : []),
      ],
    });
    if (dup) {
      throw new ConflictException('Email hoặc SĐT đã được đăng ký');
    }
    await this.admissionRepo.save(
      this.admissionRepo.create({
        fullName: dto.fullName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        dateOfBirth: dto.dob,
        intendedMajor: dto.intendedMajor,
        isSelfRegistered: true,
      }),
    );
    const user = await this.upsertStudent(
      { email: dto.email ?? null, phone: dto.phone ?? null },
      dto.fullName,
      {
        studentType: StudentType.PROSPECTIVE,
        intendedMajor: dto.intendedMajor,
        enrollmentYear: dto.enrollmentYear,
      },
    );
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  /** Sinh viên trường: xác thực MSSV + ngày sinh (làm mật khẩu). */
  async studentLogin(dto: StudentLoginDto): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    await this.assertNotLocked(dto.studentCode);
    const rec = await this.studentRecordRepo.findOne({
      where: { studentCode: dto.studentCode },
    });
    const recDob = rec ? String(rec.dateOfBirth).slice(0, 10) : null;
    if (!rec || recDob !== dto.dob) {
      await this.recordLoginFailure(dto.studentCode);
      throw new UnauthorizedException('Sai mã sinh viên hoặc ngày sinh');
    }
    await this.clearLoginFailure(dto.studentCode);
    const user = await this.upsertStudent({ studentCode: rec.studentCode }, rec.fullName, {
      studentType: StudentType.CURRENT,
      major: rec.major ?? undefined,
    });
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  /** Tạo/cập nhật user SV + student_profile, định danh theo MSSV/email/SĐT. */
  private async upsertStudent(
    identity: { studentCode?: string | null; email?: string | null; phone?: string | null },
    fullName: string,
    profile: {
      studentType: StudentType;
      major?: string;
      intendedMajor?: string;
      enrollmentYear?: number;
    },
  ): Promise<User> {
    let user: User | null = null;
    if (identity.studentCode) {
      user = await this.userRepo.findOne({ where: { studentCode: identity.studentCode } });
    }
    if (!user && identity.email) {
      user = await this.userRepo.findOne({ where: { email: identity.email } });
    }
    if (!user && identity.phone) {
      user = await this.userRepo.findOne({ where: { phone: identity.phone } });
    }
    if (!user) {
      user = this.userRepo.create({
        studentCode: identity.studentCode ?? null,
        email: identity.email ?? null,
        phone: identity.phone ?? null,
        fullName,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      });
    } else {
      user.fullName = fullName;
      if (identity.email) user.email = identity.email;
      if (identity.phone) user.phone = identity.phone;
    }
    user = await this.userRepo.save(user);

    let sp = await this.studentProfileRepo.findOne({ where: { userId: user.id } });
    if (!sp) {
      sp = this.studentProfileRepo.create({ userId: user.id });
    }
    sp.studentType = profile.studentType;
    if (profile.major !== undefined) sp.major = profile.major;
    if (profile.intendedMajor !== undefined) sp.intendedMajor = profile.intendedMajor;
    if (profile.enrollmentYear !== undefined) sp.enrollmentYear = profile.enrollmentYear;
    await this.studentProfileRepo.save(sp);

    return user;
  }

  // ---------- Chủ trọ / Admin: đăng nhập ----------

  async login(dto: LoginDto): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const user = await this.usersService.findByIdentifier(dto.identifier);
    if (!user || (!user.passwordHash && !user.tempPasswordHash)) {
      throw new UnauthorizedException('Sai email/SĐT hoặc mật khẩu');
    }

    // Khóa tạm sau nhiều lần sai (chống brute-force).
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new ForbiddenException(
        'Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ít phút.',
      );
    }

    // Chấp nhận mật khẩu chính HOẶC mật khẩu tạm còn hạn (không ghi đè MK chính).
    let matched = user.passwordHash ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    let viaTemp = false;
    if (
      !matched &&
      user.tempPasswordHash &&
      user.tempPasswordExpiresAt &&
      user.tempPasswordExpiresAt.getTime() > Date.now()
    ) {
      viaTemp = await bcrypt.compare(dto.password, user.tempPasswordHash);
      matched = viaTemp;
    }

    if (!matched) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      if (user.failedLoginAttempts >= LOGIN_MAX_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOGIN_LOCK_MS);
        user.failedLoginAttempts = 0;
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException('Sai email/SĐT hoặc mật khẩu');
    }

    if (user.role === UserRole.STUDENT) {
      throw new ForbiddenException('Sinh viên đăng nhập bằng OTP');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    // Đăng nhập thành công: reset bộ đếm; nếu dùng MK tạm thì buộc đổi.
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    if (viaTemp) user.mustChangePassword = true;
    await this.userRepo.save(user);

    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  // ---------- Chủ trọ: đăng nhập bằng Google ----------

  /**
   * Đăng nhập/đăng ký chủ trọ bằng Google. Xác minh ID token với Google,
   * lấy email + họ tên. Nếu chưa có tài khoản → tạo LANDLORD (PENDING, không
   * mật khẩu). Email đã có (chủ trọ/admin) → đăng nhập. Email của SV → từ chối.
   */
  async googleLogin(idToken: string): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const clientId = this.config.get<string>('app.googleClientId');
    if (!clientId) {
      throw new ServiceUnavailableException('Chưa cấu hình đăng nhập Google (GOOGLE_CLIENT_ID)');
    }
    let email: string | undefined;
    let emailVerified: boolean | undefined;
    let fullName: string | undefined;
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      email = payload?.email?.toLowerCase();
      emailVerified = payload?.email_verified;
      fullName = payload?.name ?? undefined;
    } catch {
      throw new UnauthorizedException('Xác thực Google thất bại');
    }
    if (!email || !emailVerified) {
      throw new UnauthorizedException('Email Google chưa được xác minh');
    }
    const name = fullName ?? email.split('@')[0];

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      if (existing.role === UserRole.STUDENT) {
        throw new ConflictException('Email này đã dùng cho tài khoản sinh viên');
      }
      if (existing.status === UserStatus.BLOCKED) {
        throw new ForbiddenException('Tài khoản đã bị khóa');
      }
      return { tokens: await this.buildTokens(existing), user: this.sanitize(existing) };
    }

    // Tạo chủ trọ mới: PENDING chờ Admin duyệt, không mật khẩu.
    const user = await this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(User, {
          fullName: name,
          email,
          role: UserRole.LANDLORD,
          status: UserStatus.PENDING,
        }),
      );
      await manager.save(
        manager.create(LandlordProfile, {
          userId: created.id,
          representativeName: name,
          verifyStatus: VerifyStatus.PENDING,
        }),
      );
      return created;
    });
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  // ---------- Quên mật khẩu (chủ trọ/admin) ----------

  /**
   * Cấp mật khẩu tạm và gửi qua email. Vì mật khẩu băm 1 chiều (bcrypt) nên
   * KHÔNG thể gửi lại mật khẩu cũ — ta tạo mật khẩu mới ngẫu nhiên, buộc đổi
   * ở lần đăng nhập kế. Luôn trả thông báo chung (không lộ email có tồn tại hay không).
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const generic = {
      message: 'Nếu email tồn tại trong hệ thống, mật khẩu tạm đã được gửi tới hộp thư.',
    };
    const user = await this.usersService.findByEmail(email);
    // Chỉ tài khoản dùng mật khẩu (chủ trọ/admin) mới khôi phục được.
    if (!user || !user.passwordHash || user.role === UserRole.STUDENT) {
      return generic;
    }

    // Cấp mật khẩu TẠM riêng, có hạn — KHÔNG ghi đè mật khẩu chính. Nhờ vậy
    // yêu cầu quên MK của kẻ xấu không khóa được tài khoản nạn nhân (MK cũ vẫn dùng).
    const tempPassword = this.generateTempPassword();
    user.tempPasswordHash = await bcrypt.hash(tempPassword, 10);
    user.tempPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ
    await this.userRepo.save(user);

    await this.mail.send({
      to: email,
      subject: '[DAU] Mật khẩu tạm để đăng nhập lại',
      text:
        `Xin chào ${user.fullName},\n\n` +
        `Bạn (hoặc ai đó) vừa yêu cầu khôi phục mật khẩu.\n` +
        `Mật khẩu tạm (hiệu lực 1 giờ) của bạn là: ${tempPassword}\n\n` +
        `Đăng nhập bằng mật khẩu tạm này và đổi mật khẩu ngay sau đó.\n` +
        `Mật khẩu cũ của bạn vẫn dùng được; nếu không phải bạn yêu cầu, có thể bỏ qua email này.`,
      html:
        `<p>Xin chào <b>${user.fullName}</b>,</p>` +
        `<p>Bạn (hoặc ai đó) vừa yêu cầu khôi phục mật khẩu.</p>` +
        `<p>Mật khẩu tạm (<b>hiệu lực 1 giờ</b>): <b style="font-size:18px">${tempPassword}</b></p>` +
        `<p>Đăng nhập bằng mật khẩu tạm rồi <b>đổi mật khẩu ngay</b>.</p>` +
        `<p style="color:#888">Mật khẩu cũ vẫn dùng được; nếu không phải bạn yêu cầu, có thể bỏ qua email này.</p>`,
    });
    return generic;
  }

  /** Sinh mật khẩu tạm dễ đọc (chữ + số), đủ mạnh để dùng tạm thời. */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = randomBytes(10);
    let out = '';
    for (let i = 0; i < 10; i++) out += chars[bytes[i] % chars.length];
    return `${out}@1`;
  }

  // ---------- Token ----------

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    return this.buildTokens(user);
  }

  async getProfile(authUser: AuthUser): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id: authUser.id } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.sanitize(user);
  }

  /** Cập nhật hồ sơ cá nhân (tên/email/SĐT). */
  async updateProfile(
    authUser: AuthUser,
    dto: { fullName?: string; email?: string; phone?: string },
  ): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id: authUser.id } });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (dto.email && dto.email !== user.email) {
      const dup = await this.userRepo.findOne({ where: { email: dto.email } });
      if (dup && dup.id !== user.id) throw new ConflictException('Email đã được dùng');
      user.email = dto.email;
    }
    if (dto.phone && dto.phone !== user.phone) {
      const dup = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (dup && dup.id !== user.id) throw new ConflictException('SĐT đã được dùng');
      user.phone = dto.phone;
    }
    if (dto.fullName) user.fullName = dto.fullName;
    return this.sanitize(await this.userRepo.save(user));
  }

  /** Đổi mật khẩu (chủ trọ/admin). "Mật khẩu hiện tại" chấp nhận cả MK tạm còn hạn. */
  async changePassword(
    authUser: AuthUser,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<{ success: true }> {
    const user = await this.userRepo.findOne({ where: { id: authUser.id } });
    if (!user || (!user.passwordHash && !user.tempPasswordHash)) {
      throw new BadRequestException('Tài khoản này không dùng mật khẩu');
    }
    const okReal = user.passwordHash
      ? await bcrypt.compare(dto.currentPassword, user.passwordHash)
      : false;
    const okTemp =
      !okReal &&
      user.tempPasswordHash &&
      user.tempPasswordExpiresAt &&
      user.tempPasswordExpiresAt.getTime() > Date.now()
        ? await bcrypt.compare(dto.currentPassword, user.tempPasswordHash)
        : false;
    if (!okReal && !okTemp) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = false;
    // Xoá mật khẩu tạm sau khi đã đặt mật khẩu mới.
    user.tempPasswordHash = null;
    user.tempPasswordExpiresAt = null;
    await this.userRepo.save(user);
    return { success: true };
  }

  private async buildTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role, phone: user.phone };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpires') ?? '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpires') ?? '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  /** Loại bỏ field nhạy cảm (password_hash) trước khi trả client. */
  private sanitize(user: User): SafeUser {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      studentCode: user.studentCode,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword ?? false,
    };
  }
}
