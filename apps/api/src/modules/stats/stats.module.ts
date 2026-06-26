import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { StatsController } from './stats.controller';
import { StatsPublicController } from './stats-public.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation, Booking, LandlordProfile, StudentProfile])],
  controllers: [StatsController, StatsPublicController],
  providers: [StatsService],
})
export class StatsModule {}
