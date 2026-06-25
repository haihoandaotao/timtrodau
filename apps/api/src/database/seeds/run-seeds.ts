/**
 * Seed dữ liệu khởi tạo — tách KHỎI migration (chuẩn dự án).
 * Chạy: npm run seed  (cần MySQL đã migrate xong).
 * Idempotent: bỏ qua bản ghi đã tồn tại.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../../config/data-source';
import { UserRole, UserStatus } from '../../common/enums';

const AREAS: Array<{ name: string; lat?: number; lng?: number }> = [
  { name: 'Hòa Xuân', lat: 16.0205, lng: 108.221 },
  { name: 'Khuê Trung', lat: 16.0258, lng: 108.2208 },
  { name: 'Hòa Cường Nam', lat: 16.0331, lng: 108.2208 },
  { name: 'Hòa Cường Bắc', lat: 16.0394, lng: 108.2185 },
  { name: 'Cẩm Lệ', lat: 16.0094, lng: 108.2025 },
];

const AMENITIES: Array<{ code: string; label: string }> = [
  { code: 'WIFI', label: 'Wifi' },
  { code: 'AIRCON', label: 'Điều hòa' },
  { code: 'FREE_HOURS', label: 'Giờ giấc tự do' },
  { code: 'MEZZANINE', label: 'Có gác lửng' },
  { code: 'WASHER', label: 'Máy giặt' },
];

async function run() {
  const ds = await AppDataSource.initialize();
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding...');

  // --- Areas ---
  for (const a of AREAS) {
    const exists = await ds.query('SELECT id FROM areas WHERE name = ? LIMIT 1', [a.name]);
    if (!exists.length) {
      await ds.query('INSERT INTO areas (name, center_lat, center_lng) VALUES (?, ?, ?)', [
        a.name,
        a.lat ?? null,
        a.lng ?? null,
      ]);
    }
  }

  // --- Amenities ---
  for (const am of AMENITIES) {
    const exists = await ds.query('SELECT id FROM amenities WHERE code = ? LIMIT 1', [am.code]);
    if (!exists.length) {
      await ds.query('INSERT INTO amenities (code, label) VALUES (?, ?)', [am.code, am.label]);
    }
  }

  // --- Admin mặc định ---
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '0900000000';
  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
  const adminExists = await ds.query('SELECT id FROM users WHERE phone = ? LIMIT 1', [adminPhone]);
  if (!adminExists.length) {
    const hash = await bcrypt.hash(adminPass, 10);
    await ds.query(
      'INSERT INTO users (full_name, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Quản trị viên', adminPhone, hash, UserRole.ADMIN, UserStatus.ACTIVE],
    );
    // eslint-disable-next-line no-console
    console.log(`👤 Admin created: ${adminPhone} / ${adminPass} (đổi mật khẩu sau!)`);
  }

  await ds.destroy();
  // eslint-disable-next-line no-console
  console.log('✅ Seed done.');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
