/**
 * E2E Test Skeleton — Auth (DAL-2, DAL-3, DAL-4)
 * Test trước, code sau. Dùng it.todo cho tới khi implement (Bước 6).
 * Framework: Jest + Supertest (NestJS). Map: docs/test-design/test-cases.md
 */
describe('Auth — Đăng nhập SV bằng MSSV + OTP (DAL-2)', () => {
  it.todo('T2-H1 (Happy): request OTP + verify đúng mã → 200, trả JWT, role=STUDENT');
  it.todo('T2-E1 (Edge): OTP ở giây cuối còn hạn → verify thành công');
  it.todo('T2-E2 (Edge): MSSV có khoảng trắng đầu/cuối → trim, xử lý đúng');
  it.todo('T2-X1 (Error): OTP sai → 400, không cấp token');
  it.todo('T2-X2 (Error): OTP hết hạn (>5 phút) → 400 expired');
  it.todo('T2-X3 (Error): OTP đã dùng lại (consumed) → 400');
  it.todo('T2-I1 (Integration): OtpService.send gọi đúng phone (mock spy 1 lần)');
});

describe('Auth — Đăng ký Chủ trọ kèm CCCD, chờ duyệt (DAL-3)', () => {
  it.todo('T3-H1 (Happy): đăng ký hợp lệ + ảnh CCCD → 201, status=PENDING');
  it.todo('T3-E1 (Edge): SĐT tồn tại ở role khác → xử lý conflict rõ ràng');
  it.todo('T3-E2 (Edge): ảnh CCCD đúng định dạng & dung lượng tối đa → chấp nhận');
  it.todo('T3-X1 (Error): thiếu CCCD → 400 validation');
  it.todo('T3-X2 (Error): SĐT trùng chủ trọ đã có → 409');
  it.todo('T3-I1 (Integration): user + landlord_profile tạo trong 1 transaction, rollback nếu lỗi');
});

describe('Auth — RBAC Guard/@Roles (DAL-4)', () => {
  it.todo('T4-H1 (Happy): ADMIN gọi endpoint admin → 200');
  it.todo('T4-E1 (Edge): token sắp hết hạn còn hợp lệ → cho qua');
  it.todo('T4-E2 (Edge): role hợp lệ nhưng không phải owner → 403');
  it.todo('T4-X1 (Error): không có token → 401');
  it.todo('T4-X2 (Error): STUDENT gọi endpoint admin → 403');
  it.todo('T4-I1 (Integration): JwtAuthGuard + RolesGuard chạy đúng chuỗi trên route thật');
});
