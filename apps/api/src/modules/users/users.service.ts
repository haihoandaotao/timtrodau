import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserRole, UserStatus } from '../../common/enums';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { User } from './entities/user.entity';
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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentRepo: Repository<StudentProfile>,
  ) {}

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
