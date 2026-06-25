import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { LandlordProfile } from '../users/entities/landlord-profile.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation, Booking, LandlordProfile])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
