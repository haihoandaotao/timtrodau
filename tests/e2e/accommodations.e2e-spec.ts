/**
 * E2E Test Skeleton — Accommodations (DAL-5, DAL-6, DAL-7, DAL-8, DAL-9, DAL-10)
 * Map: docs/test-design/test-cases.md
 */
describe('Accommodations — CRUD bài đăng, tạo→PENDING (DAL-5)', () => {
  it.todo('T5-H1 (Happy): chủ trọ tạo bài hợp lệ → 201, status=PENDING');
  it.todo('T5-E1 (Edge): giá = 0 / biên dưới → validation theo rule');
  it.todo('T5-E2 (Edge): mô tả ở max length → chấp nhận/giới hạn rõ');
  it.todo('T5-X1 (Error): thiếu title → 400');
  it.todo('T5-X2 (Error): chủ trọ chưa duyệt tạo bài → 403');
  it.todo('T5-I1 (Integration): bài đăng gắn đúng landlord_id từ JWT');
});

describe('Accommodations — Toggle còn/hết phòng (DAL-6)', () => {
  it.todo('T6-H1 (Happy): owner toggle isAvailable=false → 200');
  it.todo('T6-E1 (Edge): toggle 2 lần cùng giá trị → idempotent');
  it.todo('T6-E2 (Edge): toggle khi bài chưa PUBLISHED → cho phép, không ảnh hưởng hiển thị');
  it.todo('T6-X1 (Error): non-owner toggle → 403');
  it.todo('T6-X2 (Error): accommodationId không tồn tại → 404');
  it.todo('T6-I1 (Integration): sau toggle false, list công khai không trả phòng');
});

describe('Accommodations — Upload media qua StorageService local (DAL-7)', () => {
  it.todo('T7-H1 (Happy): upload ảnh hợp lệ → 201, trả URL static');
  it.todo('T7-E1 (Edge): ảnh đúng dung lượng tối đa → chấp nhận');
  it.todo('T7-E2 (Edge): nhiều ảnh, sort_order tăng dần → đúng thứ tự');
  it.todo('T7-X1 (Error): sai định dạng (.exe) → 400');
  it.todo('T7-X2 (Error): vượt dung lượng → 413/400');
  it.todo('T7-I1 (Integration): StorageService.save được gọi, file tồn tại trong /uploads');
});

describe('Accommodations — Smart Filter danh sách (DAL-8)', () => {
  it.todo('T8-H1 (Happy): lọc giá <1.5tr + wifi → chỉ phòng khớp & PUBLISHED');
  it.todo('T8-E1 (Edge): không filter → phân trang mặc định');
  it.todo('T8-E2 (Edge): filter không khớp → data rỗng, meta.total=0');
  it.todo('T8-X1 (Error): priceMin > priceMax → 400');
  it.todo('T8-X2 (Error): type không hợp lệ → 400');
  it.todo('T8-I1 (Integration): bài PENDING không lọt vào kết quả công khai');
});

describe('Accommodations — Chi tiết phòng + bản đồ + chi phí (DAL-9)', () => {
  it.todo('T9-H1 (Happy): chi tiết phòng PUBLISHED → 200 đủ media/lat/lng/extra_costs');
  it.todo('T9-E1 (Edge): phòng không có ảnh → images rỗng');
  it.todo('T9-E2 (Edge): extra_costs null → trả default an toàn');
  it.todo('T9-X1 (Error): id không tồn tại → 404');
  it.todo('T9-X2 (Error): phòng đã soft delete → 404');
  it.todo('T9-I1 (Integration): không lộ CCCD chủ trọ trong payload');
});

describe('Accommodations — Gợi ý khu vực (DAL-10)', () => {
  it.todo('T10-H1 (Happy): list areas seed → 200, có Hòa Xuân/Khuê Trung');
  it.todo('T10-E1 (Edge): area không có phòng → vẫn liệt kê');
  it.todo('T10-E2 (Edge): đếm số phòng theo area → số đúng');
  it.todo('T10-X1 (Error): param rác → bỏ qua/400');
  it.todo('T10-X2 (Error): seed trống → trả rỗng, không 500');
  it.todo('T10-I1 (Integration): join area ↔ accommodations đúng');
});
