import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionCandidate } from '../auth/entities/admission-candidate.entity';
import { AdmissionApiService } from './admission-api.service';
import { AdmissionSyncScheduler } from './admission-sync.scheduler';
import { AdmissionController } from './admission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdmissionCandidate])],
  controllers: [AdmissionController],
  providers: [AdmissionApiService, AdmissionSyncScheduler],
  exports: [AdmissionApiService],
})
export class AdmissionModule {}
