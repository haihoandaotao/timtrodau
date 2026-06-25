import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { StudentType, UserRole, UserStatus, VerifyStatus } from '../../common/enums';
import { AuthUser, JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { OtpService } from '../notify/otp.service';
import { User } from '../users/entities/user.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { UsersService } from '../users/users.service';
import { AdmissionCandidate } from './entities/admission-candidate.entity';
import { StudentRecord } from './entities/student-record.entity';
import { OtpRequest } from './entities/otp-request.entity';
import { LandlordRegisterDto } from './dto/landlord-register.dto';
import { LoginDto } from './dto/login.dto';
import { ProspectiveLoginDto } from './dto/prospective-login.dto';
import { ProspectiveRegisterDto } from './dto/prospective-register.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

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
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(OtpRequest) private readonly otpRepo: Repository<OtpRequest>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepo: Repository<StudentProfile>,
    @InjectRepository(AdmissionCandidate)
    private readonly admissionRepo: Repository<AdmissionCandidate>,
    @InjectRepository(StudentRecord)
    private readonly studentRecordRepo: Repository<StudentRecord>,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // ---------- SV: đăng nhập theo đối tượng (mock hệ thống ngoài) ----------

  /** Tân sinh viên: đăng nhập bằng email/SĐT + ngày sinh (mật khẩu). */
  async prospectiveLogin(
    dto: ProspectiveLoginDto,
  ): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const cand = await this.admissionRepo.findOne({
      where: [{ email: dto.identifier }, { phone: dto.identifier }],
    });
    const candDob = cand ? String(cand.dateOfBirth).slice(0, 10) : null;
    if (!cand || candDob !== dto.dob) {
      throw new UnauthorizedException('Sai email/SĐT hoặc ngày sinh');
    }
    const user = await this.upsertStudent({ email: cand.email, phone: cand.phone }, cand.fullName, {
      studentType: StudentType.PROSPECTIVE,
      intendedMajor: cand.intendedMajor ?? undefined,
    });
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
      { studentType: StudentType.PROSPECTIVE, intendedMajor: dto.intendedMajor },
    );
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  /** Sinh viên trường: xác thực MSSV + ngày sinh (làm mật khẩu). */
  async studentLogin(dto: StudentLoginDto): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const rec = await this.studentRecordRepo.findOne({
      where: { studentCode: dto.studentCode },
    });
    const recDob = rec ? String(rec.dateOfBirth).slice(0, 10) : null;
    if (!rec || recDob !== dto.dob) {
      throw new UnauthorizedException('Sai mã sinh viên hoặc ngày sinh');
    }
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
    profile: { studentType: StudentType; major?: string; intendedMajor?: string },
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
    await this.studentProfileRepo.save(sp);

    return user;
  }

  // ---------- SV: OTP login ----------

  async requestOtp(dto: RequestOtpDto): Promise<{ requestId: string }> {
    const code = this.otpService.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.otpService.ttlSeconds * 1000);

    const saved = await this.otpRepo.save(
      this.otpRepo.create({
        studentCode: dto.studentCode,
        phone: dto.phone,
        codeHash,
        expiresAt,
        consumed: false,
      }),
    );

    await this.otpService.send(dto.phone, code);
    return { requestId: saved.id };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const otp = await this.otpRepo.findOne({ where: { id: dto.requestId } });
    if (!otp) {
      throw new BadRequestException('Yêu cầu OTP không tồn tại');
    }
    if (otp.consumed) {
      throw new BadRequestException('Mã OTP đã được sử dụng');
    }
    if (otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }
    const matched = await bcrypt.compare(dto.code, otp.codeHash);
    if (!matched) {
      throw new BadRequestException('Mã OTP không đúng');
    }

    otp.consumed = true;
    await this.otpRepo.save(otp);

    const user = await this.usersService.findOrCreateStudent(otp.studentCode, otp.phone);
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  // ---------- Chủ trọ: đăng ký + đăng nhập ----------

  async registerLandlord(dto: LandlordRegisterDto): Promise<SafeUser> {
    const existing = await this.usersService.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('Số điện thoại đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(User, {
          fullName: dto.fullName,
          phone: dto.phone,
          passwordHash,
          role: UserRole.LANDLORD,
          status: UserStatus.PENDING, // chờ Admin duyệt
        }),
      );
      await manager.save(
        manager.create(LandlordProfile, {
          userId: created.id,
          idCardNo: dto.idCardNo,
          idCardImageUrl: dto.idCardImageUrl ?? null,
          address: dto.address,
          verifyStatus: VerifyStatus.PENDING,
        }),
      );
      return created;
    });

    return this.sanitize(user);
  }

  async login(dto: LoginDto): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Sai số điện thoại hoặc mật khẩu');
    }
    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('Sai số điện thoại hoặc mật khẩu');
    }
    if (user.role === UserRole.STUDENT) {
      throw new ForbiddenException('Sinh viên đăng nhập bằng OTP');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản chưa được kích hoạt/duyệt');
    }
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
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

  /** Đổi mật khẩu (chỉ tài khoản có mật khẩu: chủ trọ/admin). */
  async changePassword(
    authUser: AuthUser,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<{ success: true }> {
    const user = await this.userRepo.findOne({ where: { id: authUser.id } });
    if (!user || !user.passwordHash) {
      throw new BadRequestException('Tài khoản này không dùng mật khẩu');
    }
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
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
    };
  }
}
