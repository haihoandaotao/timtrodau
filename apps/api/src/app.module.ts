import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import {
  admissionConfig,
  appConfig,
  dbConfig,
  jwtConfig,
  mailConfig,
  storageConfig,
} from './config/env.config';
import { typeOrmModuleConfig } from './config/typeorm.module-config';
import { AccommodationsModule } from './modules/accommodations/accommodations.module';
import { AdmissionModule } from './modules/admission/admission.module';
import { AreasModule } from './modules/areas/areas.module';
import { AuthModule } from './modules/auth/auth.module';
import { BannerModule } from './modules/banner/banner.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HealthModule } from './modules/health/health.module';
import { LandlordModule } from './modules/landlord/landlord.module';
import { MailModule } from './modules/mail/mail.module';
import { MajorsModule } from './modules/majors/majors.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RoommateModule } from './modules/roommate/roommate.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatsModule } from './modules/stats/stats.module';
import { StudentsModule } from './modules/students/students.module';
import { UsersModule } from './modules/users/users.module';

/**
 * AppModule — gốc của API.
 *
 * Bảo mật secure-by-default: JwtAuthGuard + RolesGuard đăng ký toàn cục.
 * Route public phải gắn @Public(); route theo vai trò gắn @Roles(...).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [appConfig, dbConfig, jwtConfig, storageConfig, admissionConfig, mailConfig],
    }),
    // Chống lạm dụng/brute-force: mặc định 120 req/phút/IP (login siết riêng).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    // Cron job: đồng bộ tuyển sinh tự động 7h00 mỗi sáng.
    ScheduleModule.forRoot(),
    // Gửi email giao dịch (thông báo admin, khôi phục mật khẩu) — global.
    MailModule,
    // Cấu hình hệ thống chỉnh từ UI Admin (auto-approve…) — global.
    SettingsModule,
    // Thông báo trong app (chuông) — global.
    NotificationsModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => typeOrmModuleConfig(config),
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: join(process.cwd(), config.get<string>('storage.uploadDir') ?? 'uploads'),
          serveRoot: '/uploads',
        },
      ],
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    AccommodationsModule,
    BookingsModule,
    RoommateModule,
    ModerationModule,
    StatsModule,
    MajorsModule,
    FavoritesModule,
    AreasModule,
    LandlordModule,
    AdmissionModule,
    StudentsModule,
    BannerModule,
    ReviewsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
