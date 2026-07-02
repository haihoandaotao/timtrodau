import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { UserRole, UserStatus, VerifyStatus } from '../../common/enums';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { User } from './entities/user.entity';
import { LandlordProfile } from './entities/landlord-profile.entity';
import { StudentProfile } from './entities/student-profile.entity';

export interface SafeUserListItem {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  studentCode: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export interface LandlordStatsSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface LandlordDetail {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  createdAt: Date;
  verifyStatus: VerifyStatus | null;
  isTrusted: boolean;
  idCardNo: string | null;
  idCardImageUrl: string | null;
  address: string | null;
  representativeName: string | null;
  representativePhotoUrl: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentRepo: Repository<StudentProfile>,
    @InjectRepository(LandlordProfile)
    private readonly landlordRepo: Repository<LandlordProfile>,
    private readonly dataSource: DataSource,
  ) {}

  // ---------- Chủ trọ (Admin) ----------

  /** Thống kê số lượng chủ trọ theo trạng thái xác minh. */
  async landlordStats(): Promise<LandlordStatsSummary> {
    const [total, approved, pending, rejected] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.LANDLORD } }),
      this.landlordRepo.count({ where: { verifyStatus: VerifyStatus.APPROVED } }),
      this.landlordRepo.count({ where: { verifyStatus: VerifyStatus.PENDING } }),
      this.landlordRepo.count({ where: { verifyStatus: VerifyStatus.REJECTED } }),
    ]);
    return { total, approved, pending, rejected };
  }

  /** Admin xem hồ sơ chi tiết 1 chủ trọ (kể cả CCCD). */
  async landlordDetail(userId: string): Promise<LandlordDetail> {
    const user = await this.userRepo.findOne({ where: { id: userId, role: UserRole.LANDLORD } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy chủ trọ');
    }
    const profile = await this.landlordRepo.findOne({ where: { userId } });
    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      verifyStatus: profile?.verifyStatus ?? null,
      isTrusted: profile?.isTrusted ?? false,
      idCardNo: profile?.idCardNo ?? null,
      idCardImageUrl: profile?.idCardImageUrl ?? null,
      address: profile?.address ?? null,
      representativeName: profile?.representativeName ?? null,
      representativePhotoUrl: profile?.representativePhotoUrl ?? null,
    };
  }

  /**
   * Duyệt (approve=true) hoặc Hủy duyệt (approve=false) chủ trọ.
   * - Duyệt: verify_status = APPROVED, user ACTIVE (được đăng tin).
   * - Hủy duyệt: verify_status = PENDING, user PENDING (không đăng tin được).
   */
  async setLandlordApproval(userId: string, approve: boolean): Promise<LandlordDetail> {
    const user = await this.userRepo.findOne({ where: { id: userId, role: UserRole.LANDLORD } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy chủ trọ');
    }
    let profile = await this.landlordRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.landlordRepo.create({ userId });
    }
    profile.verifyStatus = approve ? VerifyStatus.APPROVED : VerifyStatus.PENDING;
    user.status = approve ? UserStatus.ACTIVE : UserStatus.PENDING;
    await this.landlordRepo.save(profile);
    await this.userRepo.save(user);
    return this.landlordDetail(userId);
  }

  /**
   * Admin: xoá tài khoản người dùng + dọn dữ liệu liên quan (transaction).
   * Không cho xoá ADMIN hoặc chính mình.
   */
  async deleteUser(id: string, currentUserId: string): Promise<{ deleted: true }> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Không thể xoá tài khoản quản trị');
    }
    if (id === currentUserId) {
      throw new ForbiddenException('Không thể tự xoá tài khoản của mình');
    }

    await this.dataSource.transaction(async (m) => {
      // Dữ liệu do user tạo
      await m.query('DELETE FROM favorites WHERE user_id = ?', [id]);
      await m.query('DELETE FROM bookings WHERE student_id = ?', [id]);
      await m.query('DELETE FROM roommate_posts WHERE student_id = ?', [id]);

      // Nếu là chủ trọ: dọn các tin đăng + dữ liệu con của tin
      const accs: Array<{ id: string }> = await m.query(
        'SELECT id FROM accommodations WHERE landlord_id = ?',
        [id],
      );
      const accIds = accs.map((a) => a.id);
      if (accIds.length) {
        await m.query('DELETE FROM bookings WHERE accommodation_id IN (?)', [accIds]);
        await m.query('DELETE FROM favorites WHERE accommodation_id IN (?)', [accIds]);
        await m.query('DELETE FROM images WHERE accommodation_id IN (?)', [accIds]);
        await m.query('DELETE FROM accommodation_amenities WHERE accommodation_id IN (?)', [
          accIds,
        ]);
        await m.query('DELETE FROM accommodations WHERE landlord_id = ?', [id]);
      }

      await m.query('DELETE FROM student_profiles WHERE user_id = ?', [id]);
      await m.query('DELETE FROM landlord_profiles WHERE user_id = ?', [id]);
      await m.query('DELETE FROM users WHERE id = ?', [id]);
    });
    return { deleted: true };
  }

  /** Admin: danh sách user theo vai trò (không trả password_hash). */
  async listForAdmin(params: {
    role?: UserRole;
    page?: number;
    limit?: number;
  }): Promise<Paginated<SafeUserListItem>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: FindOptionsWhere<User> = {};
    if (params.role) where.role = params.role;

    const [rows, total] = await this.userRepo.findAndCount({
      where,
      select: ['id', 'fullName', 'phone', 'email', 'studentCode', 'role', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: rows as SafeUserListItem[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Admin: khoá/mở tài khoản. */
  async setStatus(id: string, status: UserStatus): Promise<SafeUserListItem> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    user.status = status;
    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      fullName: saved.fullName,
      phone: saved.phone,
      email: saved.email,
      studentCode: saved.studentCode,
      role: saved.role,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  /** Tìm theo email hoặc SĐT (đăng nhập bằng 1 trong 2). */
  findByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepo.findOne({ where: [{ email: identifier }, { phone: identifier }] });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  findByStudentCode(studentCode: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { studentCode } });
  }

  /**
   * Tìm hoặc tạo SV theo studentCode + phone (dùng sau khi verify OTP).
   * Tạo kèm student_profile rỗng.
   */
  async findOrCreateStudent(studentCode: string, phone: string): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { studentCode } });
    if (existing) {
      return existing;
    }
    const user = this.userRepo.create({
      studentCode,
      phone,
      fullName: `SV ${studentCode}`,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
    const saved = await this.userRepo.save(user);
    await this.studentRepo.save(this.studentRepo.create({ userId: saved.id }));
    return saved;
  }
}
