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

/** Một bản ghi thí sinh từ API tuyển sinh chính thức (rút gọn trường cần dùng). */
interface OfficialCandidate {
  candidate_code?: string;
  id?: string;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  dob?: string | null;
  primary_major?: { code?: string; name?: string } | null;
  aspirations?: Array<{ name?: string }> | null;
}

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

  /**
   * Đồng bộ thí sinh chính thức về DB cục bộ theo phân trang JSON
   * (theo recommended_fetch_flow). Tân SV sau đó đăng nhập đối chiếu DB này.
   */
  async sync(): Promise<{ synced: number; total: number }> {
    const apiKey = this.config.get<string>('admission.apiKey');
    if (!apiKey) {
      throw new BadRequestException(
        'Chưa cấu hình ADMISSION_API_KEY — không thể đồng bộ với hệ thống tuyển sinh',
      );
    }
    const base = this.config.get<string>('admission.apiBaseUrl');
    const limit = 500;
    let offset = 0;
    let synced = 0;
    let total = 0;
    let guard = 0;

    for (;;) {
      const url = `${base}/official/admission-candidates?limit=${limit}&offset=${offset}`;
      let res: Response;
      try {
        res = await fetch(url, { headers: { 'x-api-key': apiKey } });
      } catch (e) {
        throw new ServiceUnavailableException(
          `Không kết nối được API tuyển sinh: ${(e as Error).message}`,
        );
      }
      if (!res.ok) {
        throw new ServiceUnavailableException(`API tuyển sinh trả lỗi HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        data?: OfficialCandidate[];
        meta?: { total?: number; returned?: number; has_more?: boolean };
      };
      const rows = body.data ?? [];
      total = body.meta?.total ?? total;
      for (const c of rows) {
        if (await this.upsert(c)) synced++;
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
  private async upsert(c: OfficialCandidate): Promise<boolean> {
    const dob = c.dob ? String(c.dob).slice(0, 10) : null;
    if (!dob) return false; // không có ngày sinh → không thể đăng nhập, bỏ qua
    const code = c.candidate_code ?? c.id ?? null;
    const email = c.email ?? null;
    const phone = c.phone ?? null;
    const intendedMajor = c.primary_major?.name ?? c.aspirations?.[0]?.name ?? null;

    let row: AdmissionCandidate | null = null;
    if (code) row = await this.repo.findOne({ where: { candidateCode: code } });
    if (!row && email) row = await this.repo.findOne({ where: { email } });
    if (!row && phone) row = await this.repo.findOne({ where: { phone } });
    if (!row) row = this.repo.create({ isSelfRegistered: false });

    row.candidateCode = code;
    row.fullName = c.full_name ?? row.fullName ?? 'Thí sinh';
    row.email = email;
    row.phone = phone;
    row.dateOfBirth = dob;
    row.intendedMajor = intendedMajor;
    row.isSelfRegistered = false;

    try {
      await this.repo.save(row);
      return true;
    } catch (e) {
      this.logger.warn(`Bỏ qua thí sinh ${code}: ${(e as Error).message}`);
      return false;
    }
  }
}
