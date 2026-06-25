import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { OTP_PROVIDER, OtpProvider } from './otp-provider.interface';

/**
 * OtpService — sinh mã OTP và gửi qua provider đã cấu hình.
 * Tách rõ "sinh mã" (testable) khỏi "gửi" (provider).
 */
@Injectable()
export class OtpService {
  constructor(
    @Inject(OTP_PROVIDER) private readonly provider: OtpProvider,
    private readonly config: ConfigService,
  ) {}

  /** Sinh mã OTP số, độ dài theo cấu hình (mặc định 6). */
  generateCode(): string {
    const length = this.config.get<number>('otp.length') ?? 6;
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }

  /** TTL (giây) của mã OTP. */
  get ttlSeconds(): number {
    return this.config.get<number>('otp.ttlSeconds') ?? 300;
  }

  /** Gửi mã tới số điện thoại qua provider. */
  send(phone: string, code: string): Promise<boolean> {
    return this.provider.send(phone, code);
  }
}
