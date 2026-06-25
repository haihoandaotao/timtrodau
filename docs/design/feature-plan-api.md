# Feature Plan — API Contract, Rollback & Jira

> Phần 2 của [feature-plan.md](./feature-plan.md). Mọi endpoint sẽ có Swagger đầy đủ ở Bước 6.
> Base URL: `/api/v1` · Auth: `Authorization: Bearer <JWT>` · Lỗi chuẩn hóa qua `HttpExceptionFilter`.

---

## 3. API Contract (REST)

### Quy ước chung
- Format lỗi: `{ statusCode, message, error, timestamp, path }`.
- Phân trang: `?page=1&limit=20` → `{ data: [], meta: { total, page, limit, totalPages } }`.
- Mã trạng thái: `200/201` OK · `400` validation · `401` chưa auth · `403` sai role · `404` không thấy · `409` xung đột.

### 3.1 Auth (AuthModule) — public
| Method | Endpoint | Mô tả | Body / Query | Role |
|---|---|---|---|---|
| POST | `/auth/otp/request` | Gửi OTP đăng nhập SV | `{ studentCode, phone }` | public |
| POST | `/auth/otp/verify` | Xác minh OTP → cấp token | `{ requestId, code }` | public |
| POST | `/auth/landlord/register` | Chủ trọ đăng ký (chờ duyệt) | `{ fullName, phone, password, idCardNo, address }` + file CCCD | public |
| POST | `/auth/login` | Đăng nhập chủ trọ/admin | `{ phone, password }` | public |
| POST | `/auth/refresh` | Làm mới token | `{ refreshToken }` | public |
| GET | `/auth/me` | Thông tin user hiện tại | — | any auth |

### 3.2 Accommodations (AccommodationsModule)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/accommodations` | Danh sách công khai + **Smart Filter** (`?areaId&distance&priceMin&priceMax&type&amenities[]&page&limit`) — chỉ trả `status=PUBLISHED` | public |
| GET | `/accommodations/:id` | Chi tiết (media, tọa độ, chi phí) | public |
| GET | `/accommodations/areas` | Danh sách khu vực gợi ý | public |
| GET | `/accommodations/amenities` | Danh mục tiện ích | public |
| POST | `/accommodations` | Chủ trọ tạo bài đăng (→ `PENDING`) | LANDLORD |
| PATCH | `/accommodations/:id` | Sửa bài đăng (về `PENDING` nếu sửa nội dung) | LANDLORD (owner) |
| PATCH | `/accommodations/:id/availability` | **Toggle còn/hết phòng** `{ isAvailable }` | LANDLORD (owner) |
| POST | `/accommodations/:id/images` | Upload ảnh/video (multipart → StorageService) | LANDLORD (owner) |
| DELETE | `/accommodations/:id` | Soft delete | LANDLORD (owner) / ADMIN |
| GET | `/accommodations/mine` | Bài đăng của chủ trọ | LANDLORD |

### 3.3 Bookings (BookingsModule)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/bookings` | SV đăng ký giữ chỗ `{ accommodationId, note }` → trả `contact{zalo,phone}` để deep-link | STUDENT |
| GET | `/bookings/mine` | SV xem lịch sử giữ chỗ | STUDENT |
| GET | `/bookings` | Admin xem toàn bộ (`?status&page`) | ADMIN |
| PATCH | `/bookings/:id/status` | Cập nhật `{ status }` (CONTACTED/SUCCESS/CANCELLED) | ADMIN / LANDLORD(owner) |

### 3.4 Roommate — Tìm bạn ở ghép (RoommateModule)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/roommates` | Danh sách tin ở ghép (`?major&areaId&budgetMax`) | STUDENT |
| POST | `/roommates` | Tạo tin tìm bạn ở ghép | STUDENT |
| PATCH | `/roommates/:id` | Đóng/sửa tin | STUDENT (owner) |

### 3.5 Moderation — Duyệt tin (ModerationModule)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/admin/moderation/accommodations` | Bài đăng chờ duyệt (`status=PENDING`) | ADMIN |
| PATCH | `/admin/moderation/accommodations/:id` | `{ action: APPROVE\|REJECT, reason? }` | ADMIN |
| GET | `/admin/moderation/landlords` | Chủ trọ chờ xác minh | ADMIN |
| PATCH | `/admin/moderation/landlords/:id` | Duyệt/từ chối + set `is_trusted` | ADMIN |

### 3.6 Stats — Dashboard (StatsModule)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/admin/stats/overview` | Số SV tìm được phòng, tổng bài đăng, tổng booking | ADMIN |
| GET | `/admin/stats/price-distribution` | Phân bố theo khoảng giá | ADMIN |
| GET | `/admin/stats/area-distribution` | Phân bố theo khu vực được chọn | ADMIN |
| GET | `/admin/stats/trusted-landlords` | Chủ trọ uy tín (cờ + booking thành công) | ADMIN |

> **Real-time MVP**: các endpoint stats query trực tiếp + FE có nút refresh / `refetchInterval` (TanStack Query). Websocket để giai đoạn 2.

---

## 4. Migration & Rollback Plan

### 4.1 Chiến lược migration
- Mọi schema change qua **TypeORM migration** (`<timestamp>-mô-tả.ts`), có `up()` + `down()`. **Nghiêm cấm** sửa DB trực tiếp.
- Seed (`areas`, `amenities`, tài khoản admin mặc định) tách tại `src/database/seeds/` — **không** nằm trong migration.
- Thứ tự migration đề xuất:
  1. `create-users`
  2. `create-student-landlord-profiles`
  3. `create-areas-amenities`
  4. `create-accommodations`
  5. `create-images`
  6. `create-accommodation-amenities`
  7. `create-bookings`
  8. `create-roommate-posts`
  9. `create-otp-requests`
  10. `add-indexes`

### 4.2 Rollback (mục tiêu < 5 phút)
| Cấp độ | Cách rollback |
|---|---|
| **DB schema** | `npm run migration:revert` (chạy `down()` lần lượt) |
| **Release code** | Revert theo **tag Semantic Versioning** trên `main`; redeploy artifact tag trước |
| **Hotfix** | `hotfix/*` checkout từ `main`, sau release **sync ngược về `develop`** |
| **Data nguy hiểm** | Soft delete (`deleted_at`) cho phép phục hồi không cần backup full |

### 4.3 Release flow (chuẩn dự án)
`develop` → `QA` → `staging` → `main`. Code đi một chiều từ dưới lên; merge vào `main` gắn tag `vMAJOR.MINOR.PATCH` + Release Notes tự động.

---

## 5. Phân rã Jira (Epic → Story, Given-When-Then)

> Key dự án giả định: **DAL** (DAU Accommodation Link). Story dùng định dạng acceptance Given-When-Then.

### EPIC DAL-E1 — Nền tảng & Auth
- **DAL-1** (Story) Khởi tạo monorepo (Next.js FE + NestJS BE + MySQL/TypeORM, ESLint/Prettier, strict TS).
  - *Given* repo trống *When* setup xong *Then* `npm run dev` chạy được FE+BE, healthcheck `/api/v1/health` trả 200.
- **DAL-2** Đăng nhập SV bằng MSSV/SBD + OTP.
  - *Given* SV nhập MSSV+SĐT *When* gọi `/auth/otp/request` rồi `/auth/otp/verify` đúng mã *Then* nhận JWT và user role=STUDENT.
- **DAL-3** Đăng ký + đăng nhập Chủ trọ (kèm CCCD, chờ duyệt).
  - *Given* chủ trọ submit form + ảnh CCCD *When* đăng ký *Then* tài khoản tạo ở trạng thái `PENDING`, chưa đăng tin được.
- **DAL-4** RBAC: Guard + `@Roles` cho 3 vai trò.

### EPIC DAL-E2 — Nguồn cung (Chủ trọ)
- **DAL-5** CRUD bài đăng phòng (tạo → PENDING).
- **DAL-6** Toggle trạng thái còn/hết phòng.
- **DAL-7** Upload ảnh/video qua StorageService (local).

### EPIC DAL-E3 — Tìm kiếm (Sinh viên)
- **DAL-8** Danh sách + Smart Filter (vị trí/giá/loại/tiện ích).
  - *Given* có phòng PUBLISHED *When* SV lọc giá <1.5tr & wifi *Then* chỉ trả phòng khớp, phân trang đúng.
- **DAL-9** Trang chi tiết phòng + bản đồ Google Maps + chi phí phát sinh.
- **DAL-10** Gợi ý khu vực tập trung SV DAU.

### EPIC DAL-E4 — Giữ chỗ & Ở ghép
- **DAL-11** Đăng ký giữ chỗ (in-app booking + deep-link Zalo/SĐT + thông báo).
  - *Given* SV đã đăng nhập *When* ấn giữ chỗ phòng còn trống *Then* tạo booking PENDING, trả contact, thông báo chủ trọ.
- **DAL-12** Tìm bạn ở ghép (lọc theo ngành).

### EPIC DAL-E5 — Admin: Duyệt & Dashboard
- **DAL-13** Duyệt/từ chối bài đăng & chủ trọ.
  - *Given* bài đăng PENDING *When* Admin APPROVE *Then* chuyển PUBLISHED và hiển thị công khai; REJECT thì lưu reason.
- **DAL-14** Quản lý danh sách đăng ký giữ chỗ.
- **DAL-15** Dashboard thống kê (overview, phân bố giá/khu vực, chủ trọ uy tín).

---

## 6. Handoff
Sau khi Kỹ sư duyệt thiết kế → **Bước 4: `/sc:test-design`** (thiết kế test case: ≥1 happy, ≥2 edge, ≥2 error, ≥1 integration cho mỗi User Story) → tạo skeleton trong `tests/`.
