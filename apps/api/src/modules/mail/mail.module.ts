import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * MailModule — global để mọi module gọi MailService mà không cần import lại.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
