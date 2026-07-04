import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  /**
   * Tạo thông báo (best-effort). Không ném lỗi để không chặn luồng nghiệp vụ chính.
   */
  async notify(
    userId: string | null | undefined,
    title: string,
    body?: string,
    link?: string,
  ): Promise<void> {
    if (!userId) return;
    try {
      await this.repo.save(
        this.repo.create({ userId, title, body: body ?? null, link: link ?? null, isRead: false }),
      );
    } catch (e) {
      this.logger.warn(`Không tạo được thông báo cho ${userId}: ${(e as Error).message}`);
    }
  }

  list(userId: string, page = 1, limit = 20): Promise<Paginated<Notification>> {
    return this.repo
      .findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      })
      .then(([data, total]) => ({
        data,
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      }));
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.repo.count({ where: { userId, isRead: false } }) };
  }

  async markRead(id: string, userId: string): Promise<{ success: true }> {
    await this.repo.update({ id, userId }, { isRead: true });
    return { success: true };
  }

  async markAllRead(userId: string): Promise<{ success: true }> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }
}
