import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';
import { Accommodation } from './entities/accommodation.entity';
import { Amenity } from './entities/amenity.entity';
import { Area } from './entities/area.entity';
import { Image } from './entities/image.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Accommodation, Image, Amenity, Area, Booking]),
    UsersModule,
    FilesModule,
  ],
  controllers: [AccommodationsController],
  providers: [AccommodationsService],
  exports: [AccommodationsService],
})
export class AccommodationsModule {}
