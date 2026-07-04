import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionModule } from '../admission/admission.module';
import { UsersModule } from '../users/users.module';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdmissionCandidate } from './entities/admission-candidate.entity';
import { StudentRecord } from './entities/student-record.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfile, AdmissionCandidate, StudentRecord]),
    PassportModule,
    JwtModule.register({}), // secret truyền per-sign trong AuthService
    UsersModule,
    AdmissionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
