import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentRecord } from '../auth/entities/student-record.entity';

export interface StudentListItem {
  studentCode: string;
  fullName: string;
  major: string | null;
  dateOfBirth: string;
}

export interface StudentListResult {
  data: StudentListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface StudentStats {
  total: number;
  byMajor: Array<{ major: string; count: number }>;
  byCohort: Array<{ cohort: string; count: number }>;
}

@Injectable()
export class StudentsAdminService {
  constructor(
    @InjectRepository(StudentRecord)
    private readonly repo: Repository<StudentRecord>,
  ) {}

  async list(params: {
    q?: string;
    major?: string;
    cohort?: string;
    page?: number;
    limit?: number;
  }): Promise<StudentListResult> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));

    const qb = this.repo.createQueryBuilder('sr');
    if (params.q?.trim()) {
      qb.andWhere('(sr.student_code LIKE :q OR sr.full_name LIKE :q)', {
        q: `%${params.q.trim()}%`,
      });
    }
    if (params.major?.trim()) {
      qb.andWhere('sr.major = :major', { major: params.major.trim() });
    }
    if (params.cohort?.trim()) {
      // cohort = 2 ký tự đầu MSSV (vd "18" = khoá 2018)
      qb.andWhere('sr.student_code LIKE :c', { c: `${params.cohort.trim()}%` });
    }
    qb.orderBy('sr.student_code', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map((r) => ({
        studentCode: r.studentCode,
        fullName: r.fullName,
        major: r.major,
        dateOfBirth: String(r.dateOfBirth).slice(0, 10),
      })),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async stats(): Promise<StudentStats> {
    const total = await this.repo.count();

    const byMajorRaw = await this.repo
      .createQueryBuilder('sr')
      .select('COALESCE(sr.major, :unknown)', 'major')
      .addSelect('COUNT(*)', 'count')
      .setParameter('unknown', 'Chưa rõ')
      .groupBy('sr.major')
      .orderBy('count', 'DESC')
      .getRawMany<{ major: string; count: string }>();

    const byCohortRaw = await this.repo
      .createQueryBuilder('sr')
      .select('SUBSTRING(sr.student_code, 1, 2)', 'cohort')
      .addSelect('COUNT(*)', 'count')
      .groupBy('cohort')
      .orderBy('cohort', 'ASC')
      .getRawMany<{ cohort: string; count: string }>();

    return {
      total,
      byMajor: byMajorRaw.map((r) => ({ major: r.major, count: Number(r.count) })),
      byCohort: byCohortRaw.map((r) => ({
        cohort: `20${r.cohort}`, // "18" → "2018"
        count: Number(r.count),
      })),
    };
  }
}
