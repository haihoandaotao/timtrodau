/**
 * Cấu hình tập trung đọc từ biến môi trường (.env).
 * Dùng cho ConfigModule (registerAs) — tránh đọc process.env rải rác.
 */
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  prefix: process.env.API_PREFIX ?? 'api/v1',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
}));

export const dbConfig = registerAs('db', () => ({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'dau_accommodation',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
  accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
}));

export const otpConfig = registerAs('otp', () => ({
  provider: process.env.OTP_PROVIDER ?? 'mock',
  ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10),
  length: parseInt(process.env.OTP_LENGTH ?? '6', 10),
}));

export const admissionConfig = registerAs('admission', () => ({
  // Header x-api-key = INTEGRATION_API_KEY. Base gồm /api/v1/integration;
  // endpoint chính thức: /official/admission-candidates.
  apiBaseUrl:
    process.env.INTEGRATION_API_BASE_URL ?? 'https://aff-api.ktd.edu.vn/api/v1/integration',
  apiKey: process.env.INTEGRATION_API_KEY ?? process.env.ADMISSION_API_KEY ?? '',
}));

export const storageConfig = registerAs('storage', () => ({
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '10', 10),
  allowedMime: (process.env.UPLOAD_ALLOWED_MIME ?? 'image/jpeg,image/png,image/webp,video/mp4')
    .split(',')
    .map((m) => m.trim()),
}));
