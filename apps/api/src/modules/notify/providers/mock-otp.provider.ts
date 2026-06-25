import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider } from '../otp-provider.interface';

/**
 * MockOtpProvider — dùng khi dev/test. Không gửi SMS thật, chỉ log mã ra console
 * để lập trình viên tự verify. KHÔNG dùng ở production.
 */
@Injectable()
export class MockOtpProvider implements OtpProvider {
  private readonly logger = new Logger(MockOtpProvider.name);

  async send(phone: string, code: string): Promise<boolean> {
    this.logger.log(`[MOCK OTP] Gửi tới ${phone}: mã = ${code}`);
    return true;
  }
}
