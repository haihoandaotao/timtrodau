import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Major } from './entities/major.entity';
import { MajorsController } from './majors.controller';
import { MajorsService } from './majors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Major])],
  controllers: [MajorsController],
  providers: [MajorsService],
  exports: [MajorsService],
})
export class MajorsModule {}
