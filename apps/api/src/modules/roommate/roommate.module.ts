import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoommateController } from './roommate.controller';
import { RoommateService } from './roommate.service';
import { RoommatePost } from './entities/roommate-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoommatePost])],
  controllers: [RoommateController],
  providers: [RoommateService],
  exports: [RoommateService],
})
export class RoommateModule {}
