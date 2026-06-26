import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionCandidate } from '../auth/entities/admission-candidate.entity';

/** Trường lõi sau khi chuẩn hoá (hỗ trợ cả response phẳng lẫn bọc dauAffRaw). */
export interface NormalizedCandidate {
  candidateCode: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  dob: string | null; // yyyy-mm-dd
  intendedMajor: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalize(row: any): NormalizedCandidate {
  // API mới bọc { dauAffRaw, admissionMapping }; API cũ trả phẳng.
  const r = row?.dauAffRaw ?? row ?? {};
  const m = row?.admissionMapping ?? {};
  const rawDob = r.dob ?? m.DateOfBirth ?? m.dob ?? null;
  return {
    candidateCode: row?.candidate_code ?? r.candidate_code ?? r.id ?? m.ApplicationNo ?? null,
    fullName: r.full_name ?? m.FullName ?? 'Thí sinh',
    email: r.email ?? m.Email ?? null,
    phone: r.phone ?? m.Phone ?? null,
    dob: rawDob ? String(rawDob).slice(0, 10) : null,
    intendedMajor: r.primary_major?.name ?? r.aspirations?.[0]?.name ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

@Injectable()
export class AdmissionApiService {
  private readonly logger = new Logger(AdmissionApiService.name);

  constructor(
    @InjectRepository(AdmissionCandidate)
    private readonly repo: Repository<AdmissionCandidate>,
    private readonly config: ConfigService,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('admission.apiKey'));
  }

  async status(): Promise<{ configured: boolean; syncedCount: number }> {
    const syncedCount = await this.repo.count({ where: { isSelfRegistered: false } });
    return { configured: this.isConfigured(), syncedCount };
  }

  /** Danh sách Tân sinh viên dự kiến (admission_candidates) — phân trang + tìm kiếm. */
  async listCandidates(params: { q?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const qb = this.repo.createQueryBuilder('c');
    if (params.q?.trim()) {
      qb.andWhere(
        '(c.full_name LIKE :q OR c.email LIKE :q OR c.phone LIKE :q OR c.candidate_code LIKE :q)',
        { q: `%${params.q.trim()}%` },
      );
    }
    qb.orderBy('c.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map((r) => ({
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        dateOfBirth: r.dateOfBirth ? String(r.dateOfBirth).slice(0, 10) : null,
        intendedMajor: r.intendedMajor,
        isSelfRegistered: r.isSelfRegistered,
      })),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  /** Thống kê Tân sinh viên dự kiến theo ngành. */
  async candidateStats(): Promise<{
    total: number;
    byMajor: Array<{ major: string; count: number }>;
  }> {
    const total = await this.repo.count();
    const rows = await this.repo
      .createQueryBuilder('c')
      .select('COALESCE(c.intended_major, :unknown)', 'major')
      .addSelect('COUNT(*)', 'count')
      .setParameter('unknown', 'Chưa rõ')
      .groupBy('c.intended_major')
      .orderBy('count', 'DESC')
      .getRawMany<{ major: string; count: string }>();
    return { total, byMajor: rows.map((r) => ({ major: r.major, count: Number(r.count) })) };
  }

  private candidatesUrl(query: string): string {
    const base = this.config.get<string>('admission.apiBaseUrl');
    return `${base}/api/v1/integration/admission/candidates${query}`;
  }

  /**
   * Tra cứu trực tiếp 1 thí sinh theo email/SĐT (dùng tham số q của API) —
   * phục vụ đăng nhập tân SV không cần đồng bộ trước. Trả null nếu không có.
   */
  async findByIdentifier(identifier: string): Promise<NormalizedCandidate | null> {
    const apiKey = this.config.get<string>('admission.apiKey');
    if (!apiKey) return null;
    let res: Response;
    try {
      res = await fetch(this.candidatesUrl(`?q=${encodeURIComponent(identifier)}&limit=20`), {
        headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      });
    } catch (e) {
      this.logger.warn(`Lỗi gọi API tuyển sinh: ${(e as Error).message}`);
      return null;
    }
    if (!res.ok) {
      this.logger.warn(`API tuyển sinh trả HTTP ${res.status}`);
      return null;
    }
    const body = (await res.json()) as { data?: unknown[] };
    const list = (body.data ?? []).map(normalize);
    const id = identifier.trim().toLowerCase();
    return list.find((c) => c.email?.toLowerCase() === id || c.phone === identifier.trim()) ?? null;
  }

  /**
   * Đồng bộ thí sinh về DB cục bộ theo phân trang JSON (recommended_fetch_flow).
   */
  async sync(): Promise<{ synced: number; total: number }> {
    const apiKey = this.config.get<string>('admission.apiKey');
    if (!apiKey) {
      throw new BadRequestException(
        'Chưa cấu hình INTEGRATION_API_KEY — không thể đồng bộ với hệ thống tuyển sinh',
      );
    }
    const limit = 500;
    let offset = 0;
    let synced = 0;
    let total = 0;
    let guard = 0;

    for (;;) {
      let res: Response;
      try {
        res = await fetch(this.candidatesUrl(`?limit=${limit}&offset=${offset}`), {
          headers: { 'x-api-key': apiKey, Accept: 'application/json' },
        });
      } catch (e) {
        throw new ServiceUnavailableException(
          `Không kết nối được API tuyển sinh: ${(e as Error).message}`,
        );
      }
      if (!res.ok) {
        throw new ServiceUnavailableException(`API tuyển sinh trả lỗi HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        data?: unknown[];
        meta?: { total?: number; returned?: number; has_more?: boolean };
      };
      const rows = body.data ?? [];
      total = body.meta?.total ?? total;
      for (const c of rows) {
        if (await this.upsert(normalize(c))) synced++;
      }
      if (!body.meta?.has_more) break;
      offset += body.meta?.returned ?? rows.length;
      if (++guard > 50) {
        this.logger.warn('Dừng đồng bộ do vượt ngưỡng an toàn 50 trang');
        break;
      }
    }
    return { synced, total };
  }

  /** Tạo/cập nhật 1 thí sinh; trả false nếu bỏ qua (thiếu dob hoặc trùng khoá). */
  async upsert(c: NormalizedCandidate): Promise<boolean> {
    if (!c.dob) return false; // không có ngày sinh → không thể đăng nhập, bỏ qua
    let row: AdmissionCandidate | null = null;
    if (c.candidateCode)
      row = await this.repo.findOne({ where: { candidateCode: c.candidateCode } });
    if (!row && c.email) row = await this.repo.findOne({ where: { email: c.email } });
    if (!row && c.phone) row = await this.repo.findOne({ where: { phone: c.phone } });
    if (!row) row = this.repo.create({ isSelfRegistered: false });

    row.candidateCode = c.candidateCode;
    row.fullName = c.fullName ?? row.fullName ?? 'Thí sinh';
    row.email = c.email;
    row.phone = c.phone;
    row.dateOfBirth = c.dob;
    row.intendedMajor = c.intendedMajor;
    row.isSelfRegistered = false;

    try {
      await this.repo.save(row);
      return true;
    } catch (e) {
      this.logger.warn(`Bỏ qua thí sinh ${c.candidateCode}: ${(e as Error).message}`);
      return false;
    }
  }
}
