import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { User } from '../users/entities/user.entity';
import { STORAGE_SERVICE, StorageService } from '../files/storage.interface';

export interface LandlordProfileView {
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  representativeName: string | null;
  representativePhotoUrl: string | null;
  verifyStatus: string;
  /** Đủ thông tin cơ bản chưa (địa chỉ + người đại diện + SĐT). */
  completed: boolean;
}

@Injectable()
export class LandlordProfileService {
  constructor(
    @InjectRepository(LandlordProfile) private readonly profileRepo: Repository<LandlordProfile>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async getMine(userId: string): Promise<LandlordProfileView> {
    const [user, profile] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.profileRepo.findOne({ where: { userId } }),
    ]);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    return this.view(user, profile);
  }

  async update(
    userId: string,
    dto: { representativeName?: string; phone?: string; address?: string },
  ): Promise<LandlordProfileView> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    if (dto.phone && dto.phone !== user.phone) {
      const dup = await this.userRepo.findOne({ where: { phone: dto.phone, id: Not(userId) } });
      if (dup) throw new ConflictException('Số điện thoại đã được dùng');
      user.phone = dto.phone;
      await this.userRepo.save(user);
    }

    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }
    if (dto.representativeName !== undefined) profile.representativeName = dto.representativeName;
    if (dto.address !== undefined) profile.address = dto.address;
    await this.profileRepo.save(profile);

    return this.view(user, profile);
  }

  async setPhoto(
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ): Promise<{ url: string }> {
    const saved = await this.storage.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }
    profile.representativePhotoUrl = saved.url;
    await this.profileRepo.save(profile);
    return { url: saved.url };
  }

  private view(user: User, profile: LandlordProfile | null): LandlordProfileView {
    const representativeName = profile?.representativeName ?? user.fullName;
    const address = profile?.address ?? null;
    return {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address,
      representativeName,
      representativePhotoUrl: profile?.representativePhotoUrl ?? null,
      verifyStatus: profile?.verifyStatus ?? 'PENDING',
      completed: Boolean(address && representativeName && user.phone),
    };
  }
}
