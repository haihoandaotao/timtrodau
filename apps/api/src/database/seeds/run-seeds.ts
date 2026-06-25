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

  // --- Danh sách ngành (admin cấu hình; tân SV chọn) ---
  const MAJORS = [
    'Kiến trúc',
    'Quy hoạch vùng và đô thị',
    'Kỹ thuật xây dựng',
    'Thiết kế nội thất',
    'Mỹ thuật đô thị',
    'Công nghệ thông tin',
  ];
  for (const m of MAJORS) {
    const exists = await ds.query('SELECT id FROM majors WHERE name = ? LIMIT 1', [m]);
    if (!exists.length) {
      await ds.query('INSERT INTO majors (name, is_active) VALUES (?, 1)', [m]);
    }
  }

  // --- Mock thí sinh tuyển sinh (tân SV: email/SĐT + ngày sinh) ---
  const CANDIDATES: Array<{
    name: string;
    email: string;
    phone: string;
    dob: string;
    major: string;
  }> = [
    {
      name: 'Trần Tân Sinh',
      email: 'tansinh@thisinh.dau.edu.vn',
      phone: '0931000001',
      dob: '2007-05-12',
      major: 'Kiến trúc',
    },
    {
      name: 'Lê Dự Bị',
      email: 'dubi@thisinh.dau.edu.vn',
      phone: '0931000002',
      dob: '2007-09-20',
      major: 'Thiết kế nội thất',
    },
  ];
  for (const c of CANDIDATES) {
    const exists = await ds.query('SELECT id FROM admission_candidates WHERE email = ? LIMIT 1', [
      c.email,
    ]);
    if (!exists.length) {
      await ds.query(
        'INSERT INTO admission_candidates (full_name, email, phone, date_of_birth, intended_major, is_self_registered) VALUES (?, ?, ?, ?, ?, 0)',
        [c.name, c.email, c.phone, c.dob, c.major],
      );
    }
  }

  // --- Mock sinh viên trường (SV: MSSV + ngày sinh) ---
  const STUDENTS: Array<{ code: string; name: string; major: string; dob: string }> = [
    { code: '2021120001', name: 'Nguyễn Văn Kiến', major: 'Kiến trúc', dob: '2003-05-12' },
    { code: '2021120002', name: 'Phạm Thị Trúc', major: 'Kiến trúc', dob: '2003-09-20' },
    { code: '2022150033', name: 'Hồ Quang Xây', major: 'Xây dựng', dob: '2004-01-08' },
  ];
  for (const s of STUDENTS) {
    const exists = await ds.query('SELECT id FROM student_records WHERE student_code = ? LIMIT 1', [
      s.code,
    ]);
    if (!exists.length) {
      await ds.query(
        'INSERT INTO student_records (student_code, full_name, major, date_of_birth) VALUES (?, ?, ?, ?)',
        [s.code, s.name, s.major, s.dob],
      );
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
