import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { BannerAdminController } from './banner-admin.controller';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';
import { BannerSlide } from './entities/banner-slide.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BannerSlide]), FilesModule],
  controllers: [BannerController, BannerAdminController],
  providers: [BannerService],
})
export class BannerModule {}
