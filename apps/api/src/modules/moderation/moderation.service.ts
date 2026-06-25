import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccommodationStatus, UserStatus, VerifyStatus } from '../../common/enums';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { User } from '../users/entities/user.entity';
import {
  ModerateAccommodationDto,
  ModerateLandlordDto,
  ModerationAction,
} from './dto/moderate.dto';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Accommodation) private readonly accRepo: Repository<Accommodation>,
    @InjectRepository(LandlordProfile)
    private readonly landlordRepo: Repository<LandlordProfile>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // ---------- Bài đăng ----------

  listPendingAccommodations(): Promise<Accommodation[]> {
    return this.accRepo.find({
      where: { status: AccommodationStatus.PENDING },
      relations: { images: true, area: true },
      order: { createdAt: 'ASC' },
    });
  }

  /** DAL-13: duyệt/từ chối bài. REJECT bắt buộc có reason. */
  async moderateAccommodation(id: string, dto: ModerateAccommodationDto): Promise<Accommodation> {
    const acc = await this.accRepo.findOne({ where: { id } });
    if (!acc) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }
    if (dto.action === ModerationAction.APPROVE) {
      acc.status = AccommodationStatus.PUBLISHED;
      acc.rejectReason = null;
    } else {
      if (!dto.reason || dto.reason.trim() === '') {
        throw new BadRequestException('Cần nêu lý do khi từ chối');
      }
      acc.status = AccommodationStatus.REJECTED;
      acc.rejectReason = dto.reason;
    }
    return this.accRepo.save(acc);
  }

  // ---------- Chủ trọ ----------

  listPendingLandlords(): Promise<LandlordProfile[]> {
    return this.landlordRepo.find({
      where: { verifyStatus: VerifyStatus.PENDING },
      relations: { user: true },
      order: { id: 'ASC' },
    });
  }

  /** DAL-13: duyệt/từ chối chủ trọ. APPROVE → kích hoạt tài khoản (ACTIVE). */
  async moderateLandlord(userId: string, dto: ModerateLandlordDto): Promise<LandlordProfile> {
    const profile = await this.landlordRepo.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ chủ trọ');
    }
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    if (dto.action === ModerationAction.APPROVE) {
      profile.verifyStatus = VerifyStatus.APPROVED;
      if (dto.isTrusted !== undefined) {
        profile.isTrusted = dto.isTrusted;
      }
      user.status = UserStatus.ACTIVE;
    } else {
      if (!dto.reason || dto.reason.trim() === '') {
        throw new BadRequestException('Cần nêu lý do khi từ chối');
      }
      profile.verifyStatus = VerifyStatus.REJECTED;
      user.status = UserStatus.BLOCKED;
    }

    await this.userRepo.save(user);
    return this.landlordRepo.save(profile);
  }
}
