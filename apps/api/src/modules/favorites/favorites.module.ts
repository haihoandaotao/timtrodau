import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Favorite } from './entities/favorite.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Accommodation])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
