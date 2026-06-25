# Brief — DAU Accommodation Link

> **Loại tài liệu:** Requirements Brief (Bước 2 — Brainstorm)
> **Trạng thái:** Draft v1.0 — chờ Kỹ sư duyệt trước khi sang Bước 3 (Design)
> **Ngày:** 2026-06-25
> **Nguồn chân lý:** Tài liệu này = *Cái gì + Tại sao*. (Jira = trạng thái; GitHub = code + Swagger)

---

## 1. Problem Statement (Vấn đề)

Tân sinh viên (TSV) Đại học Kiến trúc Đà Nẵng (DAU) khi nhập học gặp khó khăn trong việc tìm phòng trọ **an toàn, gần trường, đúng ngân sách**. Thông tin phòng trọ phân mảnh trên mạng xã hội, tiềm ẩn rủi ro **lừa đảo cọc phòng / môi giới ảo**, và nhà trường **thiếu dữ liệu** để hỗ trợ, khảo sát nhu cầu nội trú.

## 2. Objectives (Mục tiêu)

1. **TSV**: Tìm — lọc — xem chi tiết — đăng ký giữ chỗ phòng trọ nhanh chóng, ngay trên điện thoại (mobile-responsive web, không cần cài app).
2. **Chủ trọ** (đã xác minh): Đăng & quản lý nguồn cung phòng, cập nhật trạng thái còn/hết theo thời gian thực.
3. **Nhà trường / Đội hỗ trợ (Admin)**: Kiểm duyệt nguồn tin để chống lừa đảo, và có **dashboard thống kê** phục vụ ra quyết định hỗ trợ.

## 3. Target Users (Personas)

| Persona | Mô tả | Nhu cầu chính |
|---|---|---|
| **Tân sinh viên** | SV DAU mới nhập học, dùng điện thoại | Tìm phòng gần, rẻ, an toàn; giữ chỗ; tìm bạn ở ghép |
| **Chủ trọ** | Đối tác cung cấp phòng, **bắt buộc xác minh CCCD/SĐT/địa chỉ** | Đăng tin, cập nhật trạng thái phòng nhanh |
| **Admin** | Ban Quản trị Trường / Đội Tình nguyện | Duyệt tin, quản lý đăng ký, xem thống kê |

## 4. Success Criteria (Tiêu chí thành công)

- TSV hoàn tất luồng *tìm → lọc → xem chi tiết → giữ chỗ* trong **< 5 phút**.
- **100%** bài đăng hiển thị công khai đã qua kiểm duyệt Admin (chống lừa đảo).
- Admin xem được số liệu real-time: số TSV đã tìm được phòng, phân bố giá & khu vực.
- Giao diện sử dụng tốt trên màn hình điện thoại (mobile-first).

## 5. Scope — Phạm vi MVP (đã chốt với Kỹ sư)

### 5.1 In-scope (MVP release đầu tiên)

**Phân hệ Tân sinh viên**
- Đăng nhập bằng **MSSV / Số báo danh + xác minh OTP qua SĐT**.
- Smart Filter: theo **vị trí/khoảng cách tới trường** (<1km, 1–2km, 2–5km), **mức giá** (<1.5tr, 1.5–2.5tr, >2.5tr), **loại hình** (phòng trọ, căn hộ mini, ở ghép), **tiện ích** (wifi, điều hòa, giờ giấc tự do, gác lửng, máy giặt).
- Gợi ý khu vực tập trung SV DAU (Hòa Xuân, Khuê Trung, Hòa Cường Nam…).
- Xem chi tiết: ảnh/video, **bản đồ Google Maps + tọa độ**, chi phí phát sinh (điện/nước/vệ sinh/mạng).
- Nút **"Đăng ký tư vấn / Giữ chỗ"** → **ghi nhận booking in-app** *và* **deep-link Zalo/SĐT** tới chủ trọ/đội hỗ trợ.
- **Tìm bạn ở ghép** — lọc theo ngành học (vd Kiến trúc).

**Phân hệ Chủ trọ**
- Đăng ký tài khoản kèm **SĐT, CCCD, địa chỉ** → chờ Admin duyệt.
- Quản lý bài đăng (tạo/sửa), **toggle trạng thái [Còn phòng]/[Hết phòng]**.

**Phân hệ Admin**
- Kiểm duyệt (duyệt/từ chối) bài đăng & tài khoản chủ trọ trước khi công khai.
- Quản lý danh sách SV đăng ký giữ chỗ.
- **Dashboard real-time**: số TSV đã tìm được phòng; biểu đồ phân bố giá & khu vực; danh sách chủ trọ uy tín (phản hồi tốt).

**Kỹ thuật**
- Lưu ảnh/video: **local server + static** (thiết kế qua StorageService để swap sau).

### 5.2 Out-of-scope (giai đoạn sau)
- Đăng nhập Google/Facebook OAuth (MVP dùng MSSV + OTP).
- Thanh toán đặt cọc online.
- Native mobile app / Mini App (MVP là responsive web).
- Hệ thống đánh giá/review chi tiết (MVP chỉ cần cờ "uy tín" cơ bản từ phản hồi).
- Chat realtime in-app (MVP dùng deep-link Zalo/SĐT).

## 6. Functional Requirements (Yêu cầu chức năng — tóm tắt)

| ID | Yêu cầu | Persona |
|---|---|---|
| FR-01 | Đăng nhập/đăng ký bằng MSSV/SBD + OTP SĐT | SV |
| FR-02 | Tìm kiếm + lọc đa tiêu chí (vị trí, giá, loại hình, tiện ích) | SV |
| FR-03 | Xem chi tiết phòng (media, bản đồ, chi phí) | SV |
| FR-04 | Đăng ký giữ chỗ (in-app booking + deep-link Zalo/SĐT) | SV |
| FR-05 | Tìm bạn ở ghép theo ngành | SV |
| FR-06 | Đăng ký tài khoản chủ trọ + upload CCCD chờ duyệt | Chủ trọ |
| FR-07 | CRUD bài đăng phòng + toggle trạng thái còn/hết | Chủ trọ |
| FR-08 | Duyệt/từ chối tài khoản chủ trọ & bài đăng | Admin |
| FR-09 | Quản lý danh sách đăng ký giữ chỗ | Admin |
| FR-10 | Dashboard thống kê real-time (giá, khu vực, số liệu) | Admin |

## 7. Non-Functional Requirements

- **Nền tảng**: Mobile-responsive web (ưu tiên mobile-first).
- **Bảo mật**: JWT auth; role-based access (SV/Chủ trọ/Admin); xác minh chủ trọ qua CCCD; chống bài đăng chưa duyệt rò rỉ công khai.
- **Hiệu năng**: Trang danh sách + filter phản hồi nhanh, hỗ trợ phân trang.
- **Dữ liệu cá nhân**: CCCD/SĐT là dữ liệu nhạy cảm — hạn chế quyền xem (chỉ Admin), không hiển thị công khai.
- **Khả năng mở rộng**: StorageService trừu tượng hóa để chuyển local → cloud sau.
- **Chuẩn dự án**: Next.js (App Router) + NestJS (module hóa) + MySQL/TypeORM; TypeScript strict; mọi endpoint có Swagger.

## 8. Risks (Rủi ro)

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Giả mạo MSSV (chưa tích hợp dữ liệu trường) | TSV giả mạo | OTP SĐT; giai đoạn 2 đối chiếu DB trường/Google domain |
| Lừa đảo cọc phòng từ chủ trọ | Mất uy tín hệ thống | Bắt buộc duyệt CCCD + bài đăng trước khi công khai |
| Lộ dữ liệu CCCD/SĐT | Pháp lý, riêng tư | Phân quyền chặt; chỉ Admin xem; cân nhắc mã hóa khi lưu |
| Phụ thuộc Google Maps API (quota/chi phí) | Tính năng bản đồ lỗi | Quản lý API key, có fallback hiển thị địa chỉ text |
| Local storage media phình to | Đầy ổ đĩa server | Giới hạn dung lượng/định dạng upload; StorageService swap cloud |

## 9. Open Questions (Câu hỏi mở — cần làm rõ trước/khi Design)

1. **Nguồn dữ liệu MSSV**: Trường có cung cấp danh sách MSSV hợp lệ để đối chiếu không, hay MVP chấp nhận MSSV tự khai + OTP?
2. **OTP provider**: Dùng dịch vụ SMS nào (eSMS/Twilio/Zalo ZNS)? Có chi phí — cần chốt ngân sách.
3. **"Chủ trọ uy tín"** được xác định bằng tiêu chí nào (số booking thành công? cờ Admin thủ công? rating?).
4. **Phạm vi "real-time"** của Dashboard: cập nhật tức thời (websocket) hay refresh định kỳ/khi tải trang là đủ cho MVP?
5. **Ngôn ngữ/đa ngôn ngữ**: chỉ tiếng Việt cho MVP?
6. **Deploy target**: server nào sẽ host (ảnh hưởng tới lựa chọn local storage)?

---

### Handoff
Sau khi Kỹ sư duyệt Brief này → **Bước 3: `/sc:design`** (Kiến trúc Mermaid, API Contract, Data Model, Rollback plan) + phân rã Jira Epic→Story.
