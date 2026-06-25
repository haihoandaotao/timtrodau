import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { User } from '../users/entities/user.entity';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation, LandlordProfile, User])],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
