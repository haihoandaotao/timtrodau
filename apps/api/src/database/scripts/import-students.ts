/**
 * Import danh sách SINH VIÊN TRƯỜNG từ file CSV vào bảng student_records.
 * SV trường đăng nhập bằng MSSV + mật khẩu là NGÀY SINH (yyyy-mm-dd).
 *
 * Cách dùng:
 *   npm run import:students -- "C:\\duong-dan\\danh-sach-sv.csv"
 *
 * CSV cần có dòng tiêu đề với các cột (tên cột linh hoạt, không phân biệt hoa thường):
 *   Mã HS-SV | Họ đệm | Tên | Ngày sinh | Ngành   (Giới tính, Điện thoại, STT bỏ qua)
 * - Tự nhận dấu phân cách , hoặc ;  (Excel tiếng Việt thường dùng ;)
 * - Ngày sinh: dd/mm/yyyy  → đổi sang yyyy-mm-dd
 * - Idempotent: trùng MSSV thì cập nhật (UPSERT), không nhân đôi.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import { AppDataSource } from '../../config/data-source';

/* eslint-disable no-console */

interface ParsedRow {
  studentCode: string;
  fullName: string;
  major: string | null;
  dob: string; // yyyy-mm-dd
}

/** Parser CSV nhỏ gọn: hỗ trợ ô có dấu ngoặc kép, xuống dòng trong ô, BOM. */
function parseCsv(content: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const text = content.replace(/^﻿/, ''); // bỏ BOM

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // bỏ qua, xử lý ở \n
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Chuẩn hoá header để so khớp: bỏ dấu, hạ chữ thường, gộp khoảng trắng. */
function normHeader(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tìm index cột theo nhiều biến thể tên có thể xuất hiện. */
function findCol(headers: string[], candidates: string[]): number {
  const norm = headers.map(normHeader);
  for (const c of candidates) {
    const idx = norm.indexOf(normHeader(c));
    if (idx !== -1) return idx;
  }
  // fallback: chứa chuỗi con
  for (const c of candidates) {
    const idx = norm.findIndex((h) => h.includes(normHeader(c)));
    if (idx !== -1) return idx;
  }
  return -1;
}

/** dd/mm/yyyy (hoặc d/m/yyyy, dùng / - .) → yyyy-mm-dd. Trả null nếu không hợp lệ. */
function toIsoDate(raw: string): string | null {
  const s = (raw ?? '').trim();
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 1900 || y > 2100) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function clean(s: string | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('❌ Thiếu đường dẫn CSV. VD: npm run import:students -- "danh-sach.csv"');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`❌ Không tìm thấy file: ${file}`);
    process.exit(1);
  }

  const content = fs.readFileSync(file, 'utf8');
  const firstLine = content.replace(/^﻿/, '').split(/\r?\n/)[0] ?? '';
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const table = parseCsv(content, delimiter).filter((r) => r.some((c) => c.trim() !== ''));
  if (table.length < 2) {
    console.error('❌ CSV rỗng hoặc chỉ có tiêu đề.');
    process.exit(1);
  }

  const headers = table[0];
  const iCode = findCol(headers, ['Mã HS-SV', 'Mã HSSV', 'MSSV', 'Mã sinh viên', 'Mã SV']);
  const iHo = findCol(headers, ['Họ đệm', 'Họ và tên đệm', 'Họ']);
  const iTen = findCol(headers, ['Tên']);
  const iFull = findCol(headers, ['Họ và tên', 'Họ tên']);
  const iDob = findCol(headers, ['Ngày sinh', 'Ngày sinh (dd/mm/yyyy)']);
  const iMajor = findCol(headers, ['Ngành', 'Ngành học']);

  if (iCode === -1 || iDob === -1 || (iFull === -1 && iTen === -1)) {
    console.error(
      '❌ Thiếu cột bắt buộc. Cần: Mã HS-SV, Ngày sinh, và (Họ và tên) hoặc (Họ đệm + Tên).',
    );
    console.error('   Tiêu đề đọc được:', headers.join(' | '));
    process.exit(1);
  }
  console.log(`📑 Phân cách: "${delimiter}" · ${table.length - 1} dòng dữ liệu`);

  const rows: ParsedRow[] = [];
  let skipped = 0;
  const seen = new Set<string>();

  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const studentCode = clean(r[iCode]);
    const dob = toIsoDate(clean(r[iDob]));
    const fullName =
      iFull !== -1 && clean(r[iFull])
        ? clean(r[iFull])
        : `${clean(r[iHo])} ${clean(r[iTen])}`.trim();
    const major = iMajor !== -1 ? clean(r[iMajor]) || null : null;

    if (!studentCode || !dob || !fullName) {
      skipped++;
      continue;
    }
    if (seen.has(studentCode)) {
      skipped++; // trùng MSSV trong file → giữ dòng đầu
      continue;
    }
    seen.add(studentCode);
    rows.push({ studentCode, fullName, major, dob });
  }

  const ds = await AppDataSource.initialize();
  console.log(`🔌 Đã kết nối DB. Bắt đầu nạp ${rows.length} sinh viên…`);

  let imported = 0;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const placeholders = chunk.map(() => '(?, ?, ?, ?)').join(', ');
    const params: (string | null)[] = [];
    for (const c of chunk) params.push(c.studentCode, c.fullName, c.major, c.dob);
    await ds.query(
      `INSERT INTO student_records (student_code, full_name, major, date_of_birth)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         major = VALUES(major),
         date_of_birth = VALUES(date_of_birth)`,
      params,
    );
    imported += chunk.length;
    console.log(`   …${imported}/${rows.length}`);
  }

  const total = await ds.query('SELECT COUNT(*) AS c FROM student_records');
  console.log(`✅ Xong. Đã nạp/cập nhật ${imported} SV · bỏ qua ${skipped} dòng lỗi.`);
  console.log(`📊 Tổng student_records hiện có: ${total[0].c}`);
  await ds.destroy();
}

run().catch((e) => {
  console.error('❌ Lỗi import:', e);
  process.exit(1);
});
