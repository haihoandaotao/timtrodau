import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { LandlordProfile } from './entities/landlord-profile.entity';
import { UsersService } from './users.service';
import { UsersAdminController } from './users-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, StudentProfile, LandlordProfile])],
  controllers: [UsersAdminController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
