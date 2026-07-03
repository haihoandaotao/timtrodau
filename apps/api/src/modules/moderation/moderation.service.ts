import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccommodationStatus, UserStatus, VerifyStatus } from '../../common/enums';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { MailService } from '../mail/mail.service';
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
    private readonly mail: MailService,
  ) {}

  // ---------- Bài đăng ----------

  listPendingAccommodations(): Promise<Accommodation[]> {
    return this.accRepo.find({
      where: { status: AccommodationStatus.PENDING },
      relations: { images: true, area: true, amenities: true },
      order: { createdAt: 'ASC' },
    });
  }

  /** DAL-13: duyệt/từ chối bài. REJECT bắt buộc có reason. */
  async moderateAccommodation(id: string, dto: ModerateAccommodationDto): Promise<Accommodation> {
    const acc = await this.accRepo.findOne({ where: { id } });
    if (!acc) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }
    const approved = dto.action === ModerationAction.APPROVE;
    if (approved) {
      acc.status = AccommodationStatus.PUBLISHED;
      acc.rejectReason = null;
    } else {
      if (!dto.reason || dto.reason.trim() === '') {
        throw new BadRequestException('Cần nêu lý do khi từ chối');
      }
      acc.status = AccommodationStatus.REJECTED;
      acc.rejectReason = dto.reason;
    }
    const saved = await this.accRepo.save(acc);
    await this.notifyLandlordModeration(acc.landlordId, acc.title, approved, dto.reason);
    return saved;
  }

  /** Email báo chủ trọ kết quả duyệt bài (lỗi email không chặn nghiệp vụ). */
  private async notifyLandlordModeration(
    landlordId: string,
    title: string,
    approved: boolean,
    reason?: string,
  ): Promise<void> {
    const landlord = await this.userRepo.findOne({ where: { id: landlordId } });
    if (!landlord?.email) return;
    const subject = approved
      ? `[DAU] Bài đăng "${title}" đã được duyệt`
      : `[DAU] Bài đăng "${title}" bị từ chối`;
    const body = approved
      ? `Bài đăng "${title}" của bạn đã được duyệt và hiển thị công khai.`
      : `Bài đăng "${title}" của bạn chưa được duyệt.\nLý do: ${reason ?? ''}\nVui lòng chỉnh sửa và đăng lại.`;
    await this.mail.send({
      to: landlord.email,
      subject,
      text: `Chào ${landlord.fullName},\n\n${body}`,
      html: `<p>Chào <b>${landlord.fullName}</b>,</p><p>${body.replace(/\n/g, '<br>')}</p>`,
    });
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
