# PR: DAU Accommodation Link — MVP (DAL-1 → DAL-15)

> **Nhánh:** `feat/DAL-1-foundation-auth` → **Base:** `develop`
> **Loại:** feat (kèm 1 fix) · **Ngày:** 2026-06-25

## 🔗 Liên kết
- **Jira:** DAL-1 → DAL-15 (5 Epic: Nền tảng/Auth, Chủ trọ, Tìm kiếm, Booking/Ở ghép, Admin)
- **Docs Host:** [Brief](./brief.md) · [Feature Plan](./design/feature-plan.md) · [API Contract](./design/feature-plan-api.md) · [Test Design](./test-design/test-cases.md) · [Implementation Plan](./impl-plans/implementation-plan.md)

## 📝 Mô tả thay đổi (What & Why)
MVP hệ thống hỗ trợ tân sinh viên DAU tìm — đăng ký phòng trọ an toàn, gần trường; chủ trọ (đã xác minh) quản lý nguồn cung; nhà trường kiểm duyệt & thống kê.

Triển khai trọn vẹn theo quy trình 9 bước (Brief → Design → Test-design → Impl-plan → Code → Test → Commit):
- **Auth:** SV đăng nhập **MSSV + OTP**; chủ trọ/admin **password + JWT**; **RBAC secure-by-default** (guard toàn cục).
- **Chủ trọ:** CRUD bài đăng (tạo→PENDING), toggle còn/hết, upload media qua **StorageService** (local, swap được cloud).
- **Tìm kiếm SV:** **Smart Filter** (khu vực/khoảng cách/giá/loại/tiện ích), chi tiết + bản đồ; **chỉ trả PUBLISHED, không lộ CCCD**.
- **Booking/Ở ghép:** giữ chỗ in-app **idempotent** + deep-link **Zalo/SĐT** + notify; tìm bạn ở ghép lọc theo **ngành**.
- **Admin:** kiểm duyệt bài/chủ trọ (REJECT bắt buộc lý do), quản lý booking (SUCCESS→tăng uy tín), **Dashboard** thống kê.

## ✅ Loại thay đổi
- [x] feat (tính năng mới)
- [x] fix (rollback migration + lỗi phân trang findPublic)

## 🧪 Hướng dẫn test thủ công
```bash
# 1. DB (Docker hoặc MariaDB/MySQL local) — xem docs/database-setup.md
docker compose up -d            # hoặc dùng MySQL có sẵn
cp .env.example .env            # sửa DB_* cho khớp

# 2. Cài & migrate & seed
npm install
cd apps/api && npm run migration:run && npm run seed

# 3. Chạy
npm run dev:api    # http://localhost:3001/api/v1  (Swagger: /api/v1/docs)
npm run dev:web    # http://localhost:3000
```
**Luồng kiểm chứng (đã verify qua HTTP trên DB thật):**
1. Đăng ký chủ trọ → trạng thái PENDING.
2. Admin (`0900000000`/`Admin@123`) duyệt chủ trọ → ACTIVE.
3. Chủ trọ đăng phòng → PENDING → Admin duyệt → PUBLISHED.
4. SV: `/search` lọc phòng → mở chi tiết → "Đăng ký giữ chỗ" → hiện nút Gọi/Zalo.
5. Admin `/admin` xem dashboard số liệu cập nhật.

## 🗄️ Database / Migration
- [x] 10 migration mới (đều có `up()` + `down()`)
- [x] Đã test **`migration:run` 10/10 và `migration:revert` 10/10 sạch** trên MariaDB thật
- [x] Seed: areas, amenities, admin mặc định (tách khỏi migration)

## 📸 Screenshot / GIF
- FE routes: `/` `/search` `/rooms/[id]` `/admin` `/admin/moderation` (mobile-first). *(đính kèm khi chạy thật)*

## 🔒 Swagger / API
- [x] ~40 endpoint, tất cả endpoint mới có `@ApiOperation` + `@ApiResponse` + example. Swagger UI: `/api/v1/docs`.

## 🚦 Quality Gate
- [x] **Unit test 46 pass** (6 suites) — Auth, RBAC, Accommodations, Bookings, Roommate, Moderation
- [x] **E2E thật** qua HTTP: full flow 10 bước nghiệp vụ ✅
- [x] Lint + type-check **sạch (0 warning)**; build FE + BE sạch
- [ ] ⚠️ 85 e2e skeleton (`it.todo`) chưa hiện thực hóa — *follow-up*

## 👀 Ghi chú cho reviewer
- **2 bug được phát hiện khi verify DB thật** (commit `de0ac04`): rollback FK-index & lỗi phân trang `findPublic` — đã sửa & verify lại.
- **Follow-up (chưa trong PR này):** UI đăng nhập SV/Admin (token hiện lưu localStorage tạm); hiện thực hóa 85 e2e; cấu hình OTP/SMS provider thật; Google Maps API key.
- Dữ liệu nhạy cảm (CCCD/SĐT) không trả ra payload công khai — đã kiểm trong `findPublicById` & `trustedLandlords`.

## 📦 Commits
```
de0ac04 fix(db): rollback migration & lỗi phân trang findPublic (verify DB thật)
1a0fafc feat(admin): kiểm duyệt + quản lý booking + dashboard (DAL-13..15)
33a0969 feat(booking): giữ chỗ in-app + deep-link & ở ghép (DAL-11,12)
909b701 feat(accommodations): nguồn cung chủ trọ + tìm kiếm SV (DAL-5..10)
535e832 feat(foundation): scaffold monorepo + auth nền tảng (DAL-1..4)
```

> Jira: sau khi merge, chuyển các ticket DAL-1..15 sang **In QA**.
