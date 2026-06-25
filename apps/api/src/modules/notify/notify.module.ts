import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { NotifyService } from './notify.service';
import { OTP_PROVIDER } from './otp-provider.interface';
import { MockOtpProvider } from './providers/mock-otp.provider';

/**
 * NotifyModule — cung cấp OtpService + NotifyService cho toàn app.
 * Provider OTP được chọn theo config (MVP: mock). Mở rộng: thêm case esms/twilio/zns.
 */
@Module({
  providers: [
    MockOtpProvider,
    {
      provide: OTP_PROVIDER,
      inject: [ConfigService, MockOtpProvider],
      useFactory: (config: ConfigService, mock: MockOtpProvider) => {
        const provider = config.get<string>('otp.provider') ?? 'mock';
        switch (provider) {
          case 'mock':
          default:
            return mock;
        }
      },
    },
    OtpService,
    NotifyService,
  ],
  exports: [OtpService, NotifyService],
})
export class NotifyModule {}
