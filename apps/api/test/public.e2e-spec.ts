/**
 * E2E thật (cần MySQL/MariaDB đã migrate + seed) — kiểm thử các endpoint
 * công khai read-only, không làm bẩn dữ liệu. Bổ sung cho unit test.
 * Chạy: npm run test:e2e (đảm bảo DB ở .env đang chạy).
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Public endpoints (e2e, cần DB)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health → 200 ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/v1/majors → mảng ngành (≥1)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/majors').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/accommodations → có meta phân trang', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/accommodations').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta.total');
  });

  it('GET /api/v1/public/stats/overview → có tổng số phòng', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/stats/overview')
      .expect(200);
    expect(res.body).toHaveProperty('totalRooms');
  });

  it('GET /api/v1/admin/stats/overview KHÔNG token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/stats/overview').expect(401);
  });
});
