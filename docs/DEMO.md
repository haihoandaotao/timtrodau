# Hướng dẫn Demo — DAU Accommodation Link

## 0. Khởi động (nếu chưa chạy)
```bash
# DB: MariaDB/MySQL ở 127.0.0.1:3306, DB dau_accommodation (xem docs/database-setup.md)
cd apps/api && npm run migration:run && npm run seed   # chỉ lần đầu
# Chạy 2 server:
npm run dev:api    # API  → http://localhost:3001/api/v1   (Swagger: /api/v1/docs)
npm run dev:web    # Web  → http://localhost:3000
```

## Tài khoản & dữ liệu mẫu
Trang `/login` cho **chọn đối tượng** trước:
| Đối tượng | Đăng nhập | Ghi chú |
|---|---|---|
| **Tân sinh viên** | SBD `DDN2025001` / mật khẩu `ThiSinh@123` / ngành dự kiến tuỳ nhập | tài khoản thí sinh tuyển sinh (mock) |
| **Sinh viên trường** | MSSV `2021120001` / ngày sinh `2003-05-12` | mật khẩu = ngày sinh; SV khác: `2021120002`/`2003-09-20`, `2022150033`/`2004-01-08` |
| **Chủ trọ** | SĐT `0905111222` / mật khẩu `Pass@123` | đã được duyệt (ACTIVE) |
| **Admin** | SĐT `0900000000` / mật khẩu `Admin@123` | vào thẳng `/admin` |
- 5 phòng mẫu đã PUBLISHED (giá 1.0tr → 2.8tr, đủ loại, nhiều khu vực).
- Màu nhận diện: **đỏ #C8102E**. Trang chủ là **dashboard công khai** (số liệu + phòng nổi bật + biểu đồ).

---

## Kịch bản 1 — Sinh viên tìm & giữ chỗ
1. Mở **http://localhost:3000** → bấm **🔍 Tìm phòng trọ ngay** (hoặc `/search`).
2. **Lọc thông minh**: chọn chip *Dưới 1.5tr*, *Dưới 1km*, loại *Ở ghép*, khu vực *Hòa Xuân*, tiện ích *Wifi/Điều hòa* → danh sách cập nhật tức thì.
3. Bấm 1 phòng → trang chi tiết: ảnh, **bản đồ Google Maps**, **chi phí phát sinh** (điện/nước/mạng), tiện ích.
4. Bấm **Đăng nhập sinh viên để giữ chỗ** → `/login` → chọn **Sinh viên của trường** → MSSV `2021120001` + ngày sinh `2003-05-12` (hoặc **Tân sinh viên** với SBD `DDN2025001`/`ThiSinh@123`).
5. Quay lại phòng → **Đăng ký giữ chỗ** → hiện nút **📞 Gọi** + **💬 Zalo** (deep-link chủ trọ).

## Kịch bản 2 — Chủ trọ đăng phòng
1. `/login` → tab **Chủ trọ / Admin** → `0905111222` / `Pass@123`.
2. Đăng tin qua API `POST /accommodations` (Swagger `/api/v1/docs`) — bài mới ở trạng thái **PENDING** (chờ duyệt), chưa hiện công khai.
3. Cập nhật còn/hết phòng: `PATCH /accommodations/:id/availability`.

## Kịch bản 3 — Admin duyệt & xem thống kê
1. `/login` → tab **Chủ trọ / Admin** → `0900000000` / `Admin@123` → tự chuyển tới **/admin**.
2. **Dashboard**: số SV tìm được phòng, tổng booking, **biểu đồ phân bố giá & khu vực**, **chủ trọ uy tín**. Nút **↻ Làm mới**.
3. Vào **Duyệt tin** (`/admin/moderation`): danh sách bài PENDING → **✓ Duyệt** (→ PUBLISHED, hiện công khai) hoặc **✕ Từ chối** (bắt buộc nhập lý do).

---

## Khám phá API (Swagger)
Mở **http://localhost:3001/api/v1/docs** — thử mọi endpoint, có example & mô tả. Bấm **Authorize** dán `accessToken` để gọi endpoint cần quyền.

## Điểm nhấn kỹ thuật để ý khi demo
- Bài **PENDING không bao giờ lọt** vào danh sách công khai (chống lừa đảo).
- Payload công khai **không chứa CCCD/SĐT nhạy cảm** của chủ trọ.
- RBAC: gọi endpoint admin khi chưa đăng nhập → **401**; sai vai trò → **403**.
