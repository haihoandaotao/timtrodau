import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';

/** Khoá cấu hình: bật tự động duyệt bài đăng (true) hay duyệt thủ công (false). */
export const SETTING_AUTO_APPROVE = 'moderation.auto_approve';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(AppSetting) private readonly repo: Repository<AppSetting>) {}

  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.repo.save(this.repo.create({ key, value }));
  }

  /** Cờ tự động duyệt bài. Mặc định false (duyệt thủ công) nếu chưa cấu hình. */
  async isAutoApprove(): Promise<boolean> {
    return (await this.get(SETTING_AUTO_APPROVE)) === 'true';
  }

  async setAutoApprove(enabled: boolean): Promise<void> {
    await this.set(SETTING_AUTO_APPROVE, enabled ? 'true' : 'false');
  }

  /** Trạng thái cấu hình kiểm duyệt cho UI Admin. */
  async getModeration(): Promise<{ autoApprove: boolean }> {
    return { autoApprove: await this.isAutoApprove() };
  }
}
