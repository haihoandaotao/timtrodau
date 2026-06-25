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

  /** Tân sinh viên: xác thực tài khoản thí sinh (SBD + mật khẩu) + ngành dự kiến. */
  async prospectiveLogin(
    dto: ProspectiveLoginDto,
  ): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const cand = await this.admissionRepo.findOne({ where: { sbd: dto.sbd } });
    if (!cand || !(await bcrypt.compare(dto.password, cand.passwordHash))) {
      throw new UnauthorizedException('Sai số báo danh hoặc mật khẩu thí sinh');
    }
    const user = await this.upsertStudent(dto.sbd, cand.fullName, {
      studentType: StudentType.PROSPECTIVE,
      intendedMajor: dto.intendedMajor,
      major: dto.intendedMajor,
    });
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
    const user = await this.upsertStudent(rec.studentCode, rec.fullName, {
      studentType: StudentType.CURRENT,
      major: rec.major ?? undefined,
    });
    return { tokens: await this.buildTokens(user), user: this.sanitize(user) };
  }

  /** Tạo/cập nhật user SV + student_profile từ dữ liệu hệ thống ngoài. */
  private async upsertStudent(
    studentCode: string,
    fullName: string,
    profile: { studentType: StudentType; major?: string; intendedMajor?: string },
  ): Promise<User> {
    let user = await this.userRepo.findOne({ where: { studentCode } });
    if (!user) {
      user = this.userRepo.create({
        studentCode,
        fullName,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      });
    } else {
      user.fullName = fullName;
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
