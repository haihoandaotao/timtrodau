import { Module } from '@nestjs/common';
import { NotifyService } from './notify.service';

/**
 * NotifyModule — thông báo nghiệp vụ (booking) qua NotifyService.
 * (Đăng nhập OTP đã được gỡ; SV đăng nhập bằng ngày sinh / MSSV.)
 */
@Module({
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
