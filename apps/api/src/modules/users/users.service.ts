import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole, UserStatus } from '../../common/enums';
import { User } from './entities/user.entity';
import { StudentProfile } from './entities/student-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentRepo: Repository<StudentProfile>,
  ) {}

  findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone } });
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
