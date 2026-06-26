import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentRecord } from '../auth/entities/student-record.entity';
import { StudentsAdminController } from './students-admin.controller';
import { StudentsAdminService } from './students-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentRecord])],
  controllers: [StudentsAdminController],
  providers: [StudentsAdminService],
})
export class StudentsModule {}
