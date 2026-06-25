# Test Design — DAU Accommodation Link

> **Loại tài liệu:** Test Case Design (Bước 4 — Test trước, code sau) · **Persona:** QA
> **Trạng thái:** Draft v1.0 · **Ngày:** 2026-06-25
> **Tham chiếu:** [feature-plan-api.md](../design/feature-plan-api.md)
> **Quy tắc tối thiểu / mỗi User Story:** Happy ≥1 · Edge ≥2 · Error ≥2 · Integration ≥1
> **Skeleton:** `tests/` (e2e + unit). Framework test: Jest + Supertest (NestJS).

---

## Ma trận test theo Story

Ký hiệu: **H**=Happy · **E**=Edge · **X**=Error · **I**=Integration

### DAL-2 — Đăng nhập SV (MSSV + OTP)
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T2-H1 | H | request OTP + verify đúng mã | 200, trả JWT, user role=STUDENT |
| T2-E1 | E | OTP gần hết hạn (giây cuối) | vẫn verify thành công |
| T2-E2 | E | MSSV có khoảng trắng/đầu-cuối | trim, xử lý đúng |
| T2-X1 | X | OTP sai | 400, không cấp token |
| T2-X2 | X | OTP hết hạn (>5 phút) | 400 expired |
| T2-X3 | X | OTP dùng lại (consumed) | 400 |
| T2-I1 | I | OtpService được gọi gửi SMS (mock) đúng phone | spy gọi 1 lần |

### DAL-3 — Đăng ký Chủ trọ (CCCD, chờ duyệt)
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T3-H1 | H | đăng ký hợp lệ + ảnh CCCD | 201, user status=PENDING |
| T3-E1 | E | SĐT đã tồn tại role khác | xử lý đúng (conflict rõ ràng) |
| T3-E2 | E | ảnh CCCD đúng định dạng tối đa cho phép | chấp nhận |
| T3-X1 | X | thiếu CCCD | 400 validation |
| T3-X2 | X | SĐT trùng chủ trọ đã có | 409 |
| T3-I1 | I | profile + user tạo trong 1 transaction | rollback nếu lỗi |

### DAL-4 — RBAC Guard/@Roles
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T4-H1 | H | ADMIN gọi endpoint admin | 200 |
| T4-E1 | E | token sắp hết hạn còn hợp lệ | cho qua |
| T4-E2 | E | role hợp lệ nhưng không phải owner | 403 (chặn cross-owner) |
| T4-X1 | X | không có token | 401 |
| T4-X2 | X | STUDENT gọi endpoint admin | 403 |
| T4-I1 | I | RolesGuard + JwtAuthGuard kết hợp trên route thật | chuỗi guard chạy đúng |

### DAL-5 — CRUD bài đăng (tạo → PENDING)
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T5-H1 | H | chủ trọ tạo bài hợp lệ | 201, status=PENDING |
| T5-E1 | E | giá = 0 / biên dưới | validation theo rule |
| T5-E2 | E | mô tả rất dài (max length) | chấp nhận/giới hạn rõ |
| T5-X1 | X | thiếu trường bắt buộc (title) | 400 |
| T5-X2 | X | chủ trọ chưa duyệt (PENDING) tạo bài | 403 |
| T5-I1 | I | bài đăng gắn đúng landlord_id từ JWT | liên kết đúng |

### DAL-6 — Toggle còn/hết phòng
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T6-H1 | H | owner toggle isAvailable=false | 200, cập nhật DB |
| T6-E1 | E | toggle 2 lần liên tiếp cùng giá trị | idempotent |
| T6-E2 | E | toggle khi bài chưa PUBLISHED | cho phép nhưng không ảnh hưởng hiển thị |
| T6-X1 | X | non-owner toggle | 403 |
| T6-X2 | X | accommodationId không tồn tại | 404 |
| T6-I1 | I | sau toggle false, list công khai không trả phòng | end-to-end |

### DAL-7 — Upload media (StorageService local)
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T7-H1 | H | upload ảnh hợp lệ | 201, trả URL static |
| T7-E1 | E | ảnh đúng dung lượng tối đa | chấp nhận |
| T7-E2 | E | nhiều ảnh cùng lúc, sort_order tăng | đúng thứ tự |
| T7-X1 | X | sai định dạng (.exe) | 400 |
| T7-X2 | X | vượt dung lượng | 413/400 |
| T7-I1 | I | StorageService.save được gọi, file tồn tại trong /uploads | mock/verify |

### DAL-8 — Smart Filter danh sách
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T8-H1 | H | lọc giá <1.5tr + wifi | chỉ trả phòng khớp + PUBLISHED |
| T8-E1 | E | không filter (lấy tất cả) | phân trang mặc định |
| T8-E2 | E | filter không khớp gì | data rỗng, meta.total=0 |
| T8-X1 | X | priceMin > priceMax | 400 |
| T8-X2 | X | type không hợp lệ | 400 |
| T8-I1 | I | bài PENDING không lọt vào kết quả công khai | bảo mật hiển thị |

### DAL-9 — Chi tiết phòng + bản đồ + chi phí
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T9-H1 | H | lấy chi tiết phòng PUBLISHED | 200 đầy đủ media/lat/lng/extra_costs |
| T9-E1 | E | phòng không có ảnh | trả mảng images rỗng |
| T9-E2 | E | extra_costs null | trả default/null an toàn |
| T9-X1 | X | id không tồn tại | 404 |
| T9-X2 | X | phòng đã soft delete | 404 |
| T9-I1 | I | không lộ CCCD chủ trọ trong payload | field nhạy cảm bị loại |

### DAL-10 — Gợi ý khu vực
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T10-H1 | H | lấy danh sách areas seed | 200, có Hòa Xuân/Khuê Trung... |
| T10-E1 | E | area không có phòng nào | vẫn liệt kê area |
| T10-E2 | E | đếm số phòng theo area | số đúng |
| T10-X1 | X | gọi với param rác | bỏ qua/400 |
| T10-X2 | X | DB seed trống | trả rỗng, không 500 |
| T10-I1 | I | join area ↔ accommodations đúng | dữ liệu khớp |

### DAL-11 — Đăng ký giữ chỗ
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T11-H1 | H | SV giữ chỗ phòng còn trống | 201, booking PENDING, trả contact{zalo,phone} |
| T11-E1 | E | SV giữ chỗ 2 phòng khác nhau | đều thành công |
| T11-E2 | E | giữ lại đúng phòng đã giữ | xử lý trùng rõ ràng (không tạo dup) |
| T11-X1 | X | giữ chỗ phòng isAvailable=false | 409 |
| T11-X2 | X | giữ chỗ phòng chưa PUBLISHED | 409/404 |
| T11-I1 | I | NotifyModule gửi thông báo chủ trọ (mock) | spy gọi 1 lần |

### DAL-12 — Tìm bạn ở ghép
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T12-H1 | H | tạo + lọc tin theo ngành Kiến trúc | trả tin đúng ngành |
| T12-E1 | E | lọc theo budgetMax biên | bao gồm đúng |
| T12-E2 | E | nhiều ngành, lọc 1 ngành | chỉ ngành đó |
| T12-X1 | X | tạo tin thiếu major | 400 |
| T12-X2 | X | non-student tạo tin | 403 |
| T12-I1 | I | tin gắn đúng student_id + major từ profile | liên kết đúng |

### DAL-13 — Duyệt bài đăng & chủ trọ
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T13-H1 | H | Admin APPROVE bài PENDING | status→PUBLISHED, hiện công khai |
| T13-E1 | E | APPROVE bài đã PUBLISHED | idempotent/cảnh báo |
| T13-E2 | E | REJECT kèm reason dài | lưu reason |
| T13-X1 | X | REJECT không reason | 400 (reason bắt buộc) |
| T13-X2 | X | non-admin duyệt | 403 |
| T13-I1 | I | sau APPROVE, GET /accommodations trả bài đó | end-to-end |

### DAL-14 — Quản lý danh sách giữ chỗ (Admin)
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T14-H1 | H | Admin list bookings + lọc status | 200 phân trang |
| T14-E1 | E | trang vượt tổng số | data rỗng |
| T14-E2 | E | cập nhật status SUCCESS | tăng verified_booking_count chủ trọ |
| T14-X1 | X | status không hợp lệ | 400 |
| T14-X2 | X | non-admin list all | 403 |
| T14-I1 | I | đổi status SUCCESS phản ánh vào stats | liên thông StatsModule |

### DAL-15 — Dashboard thống kê
| ID | Loại | Mô tả | Kỳ vọng |
|---|---|---|---|
| T15-H1 | H | overview trả số liệu đúng | counts khớp seed |
| T15-E1 | E | DB chưa có dữ liệu | trả 0, không 500 |
| T15-E2 | E | phân bố giá theo đúng khoảng (<1.5/1.5-2.5/>2.5) | bucket đúng |
| T15-X1 | X | non-admin gọi stats | 403 |
| T15-X2 | X | param khoảng thời gian sai | 400 |
| T15-I1 | I | area-distribution join đúng bookings↔accommodations↔areas | số liệu khớp |

---

## Tổng kết coverage mục tiêu
- **15 Story** × (≥1H + ≥2E + ≥2X + ≥1I) = **≥90 test case** thiết kế.
- Quality Gate Bước 7: 100% unit & integration pass · Delta coverage code mới ≥ 80% · lint/type-check sạch.

## Handoff
→ **Bước 5: `/sc:workflow --detail`** — Implementation Plan (checklist thứ tự file cần tạo/sửa + migration) lưu `docs/impl-plans/`.
