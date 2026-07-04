import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { LandlordReview } from './entities/landlord-review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([LandlordReview, Booking, Accommodation])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
