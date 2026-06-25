/**
 * E2E Test Skeleton — Bookings & Roommate (DAL-11, DAL-12)
 * Map: docs/test-design/test-cases.md
 */
describe('Bookings — Đăng ký giữ chỗ (DAL-11)', () => {
  it.todo('T11-H1 (Happy): SV giữ chỗ phòng còn trống → 201, PENDING, trả contact{zalo,phone}');
  it.todo('T11-E1 (Edge): SV giữ chỗ 2 phòng khác nhau → đều thành công');
  it.todo('T11-E2 (Edge): giữ lại đúng phòng đã giữ → không tạo duplicate');
  it.todo('T11-X1 (Error): giữ chỗ phòng isAvailable=false → 409');
  it.todo('T11-X2 (Error): giữ chỗ phòng chưa PUBLISHED → 409/404');
  it.todo('T11-I1 (Integration): NotifyModule gửi thông báo chủ trọ (mock spy 1 lần)');
});

describe('Roommate — Tìm bạn ở ghép theo ngành (DAL-12)', () => {
  it.todo('T12-H1 (Happy): tạo + lọc tin theo ngành Kiến trúc → trả đúng ngành');
  it.todo('T12-E1 (Edge): lọc theo budgetMax biên → bao gồm đúng');
  it.todo('T12-E2 (Edge): nhiều ngành, lọc 1 ngành → chỉ ngành đó');
  it.todo('T12-X1 (Error): tạo tin thiếu major → 400');
  it.todo('T12-X2 (Error): non-student tạo tin → 403');
  it.todo('T12-I1 (Integration): tin gắn đúng student_id + major từ profile');
});
