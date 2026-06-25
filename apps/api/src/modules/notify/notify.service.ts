import { Injectable, Logger } from '@nestjs/common';

/**
 * NotifyService — gửi thông báo nghiệp vụ (chủ trọ, đội hỗ trợ) khi có booking.
 * MVP: log/console (mock). Sau này nối email/push/Zalo ZNS.
 */
@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  async notifyNewBooking(params: {
    landlordPhone: string;
    accommodationTitle: string;
    studentName: string;
  }): Promise<void> {
    this.logger.log(
      `[NOTIFY] Booking mới cho "${params.accommodationTitle}" — SV ${params.studentName}. ` +
        `Báo chủ trọ ${params.landlordPhone}.`,
    );
  }
}
