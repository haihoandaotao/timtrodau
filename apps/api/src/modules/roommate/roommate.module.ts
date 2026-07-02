import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { RoommateController } from './roommate.controller';
import { RoommateService } from './roommate.service';
import { RoommatePost } from './entities/roommate-post.entity';
import { RoommatePostImage } from './entities/roommate-post-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoommatePost, RoommatePostImage]), FilesModule],
  controllers: [RoommateController],
  providers: [RoommateService],
  exports: [RoommateService],
})
export class RoommateModule {}
