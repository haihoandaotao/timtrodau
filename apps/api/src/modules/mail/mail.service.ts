import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * MailService — gửi email giao dịch qua Gmail SMTP (App Password).
 *
 * Nếu chưa cấu hình GMAIL_USER/GMAIL_APP_PASSWORD thì chạy chế độ "mock":
 * chỉ log nội dung ra console, KHÔNG ném lỗi — để môi trường dev không cần SMTP
 * vẫn hoạt động. Production phải điền .env để email được gửi thật.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('mail.user');
    const pass = this.config.get<string>('mail.appPassword');
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'Chưa cấu hình GMAIL_USER/GMAIL_APP_PASSWORD — email chạy chế độ mock (chỉ log console).',
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /** Email nhận thông báo quản trị (bài đăng mới…). */
  adminAddress(): string {
    return this.config.get<string>('mail.adminNotify') ?? '';
  }

  /**
   * Gửi email. Trả true nếu đã gửi (hoặc mock thành công), false nếu lỗi thật.
   * Không ném lỗi ra ngoài để luồng nghiệp vụ chính không bị chặn vì email.
   */
  async send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    const from = this.config.get<string>('mail.from') || this.config.get<string>('mail.user') || '';
    if (!this.transporter) {
      this.logger.log(
        `[MOCK MAIL] → ${params.to} | ${params.subject}\n${params.text ?? params.html}`,
      );
      return true;
    }
    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      this.logger.log(`Đã gửi email "${params.subject}" → ${params.to}`);
      return true;
    } catch (e) {
      this.logger.error(`Gửi email thất bại → ${params.to}: ${(e as Error).message}`);
      return false;
    }
  }
}
