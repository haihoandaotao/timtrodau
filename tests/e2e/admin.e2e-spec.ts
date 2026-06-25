/**
 * E2E Test Skeleton — Admin: Moderation & Stats (DAL-13, DAL-14, DAL-15)
 * Map: docs/test-design/test-cases.md
 */
describe('Moderation — Duyệt bài đăng & chủ trọ (DAL-13)', () => {
  it.todo('T13-H1 (Happy): Admin APPROVE bài PENDING → PUBLISHED, hiện công khai');
  it.todo('T13-E1 (Edge): APPROVE bài đã PUBLISHED → idempotent/cảnh báo');
  it.todo('T13-E2 (Edge): REJECT kèm reason dài → lưu reason');
  it.todo('T13-X1 (Error): REJECT không reason → 400 (reason bắt buộc)');
  it.todo('T13-X2 (Error): non-admin duyệt → 403');
  it.todo('T13-I1 (Integration): sau APPROVE, GET /accommodations trả bài đó');
});

describe('Bookings Admin — Quản lý danh sách giữ chỗ (DAL-14)', () => {
  it.todo('T14-H1 (Happy): Admin list bookings + lọc status → 200 phân trang');
  it.todo('T14-E1 (Edge): trang vượt tổng số → data rỗng');
  it.todo('T14-E2 (Edge): cập nhật status SUCCESS → tăng verified_booking_count');
  it.todo('T14-X1 (Error): status không hợp lệ → 400');
  it.todo('T14-X2 (Error): non-admin list all → 403');
  it.todo('T14-I1 (Integration): đổi status SUCCESS phản ánh vào StatsModule');
});

describe('Stats — Dashboard thống kê (DAL-15)', () => {
  it.todo('T15-H1 (Happy): overview trả số liệu đúng (khớp seed)');
  it.todo('T15-E1 (Edge): DB chưa có dữ liệu → trả 0, không 500');
  it.todo('T15-E2 (Edge): phân bố giá đúng bucket (<1.5/1.5-2.5/>2.5)');
  it.todo('T15-X1 (Error): non-admin gọi stats → 403');
  it.todo('T15-X2 (Error): param khoảng thời gian sai → 400');
  it.todo('T15-I1 (Integration): area-distribution join bookings↔accommodations↔areas đúng');
});
