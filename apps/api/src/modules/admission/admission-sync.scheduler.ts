import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdmissionApiService } from './admission-api.service';

/**
 * Tự động đồng bộ thí sinh từ hệ thống tuyển sinh lúc 7h00 mỗi sáng
 * (giờ Việt Nam). Bỏ qua nếu chưa cấu hình INTEGRATION_API_KEY.
 *
 * Vẫn giữ nút "Đồng bộ tuyển sinh" thủ công ở UI cho lần chạy đột xuất.
 */
@Injectable()
export class AdmissionSyncScheduler {
  private readonly logger = new Logger(AdmissionSyncScheduler.name);

  constructor(private readonly service: AdmissionApiService) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'admission-daily-sync',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailySync(): Promise<void> {
    if (!this.service.isConfigured()) {
      this.logger.warn('Bỏ qua đồng bộ tự động: chưa cấu hình INTEGRATION_API_KEY');
      return;
    }
    this.logger.log('Bắt đầu đồng bộ tuyển sinh tự động (7h00)…');
    try {
      const { synced, total } = await this.service.sync();
      this.logger.log(`Đồng bộ tự động xong: ${synced}/${total} thí sinh`);
    } catch (e) {
      this.logger.error(`Đồng bộ tự động thất bại: ${(e as Error).message}`);
    }
  }
}
