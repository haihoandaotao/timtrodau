import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

/**
 * SettingsModule — global để các module (accommodations…) đọc cấu hình
 * mà không cần import lại.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AppSetting])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
