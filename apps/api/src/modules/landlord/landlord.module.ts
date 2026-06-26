import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { User } from '../users/entities/user.entity';
import { LandlordProfileController } from './landlord-profile.controller';
import { LandlordProfileService } from './landlord-profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([LandlordProfile, User]), FilesModule],
  controllers: [LandlordProfileController],
  providers: [LandlordProfileService],
})
export class LandlordModule {}
