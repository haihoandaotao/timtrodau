# Tests — DAU Accommodation Link

Skeleton test được tạo ở **Bước 4 (Test trước, code sau)**, ánh xạ 1-1 với
[docs/test-design/test-cases.md](../docs/test-design/test-cases.md).

## Cấu trúc
- `e2e/auth.e2e-spec.ts` — DAL-2, DAL-3, DAL-4
- `e2e/accommodations.e2e-spec.ts` — DAL-5 → DAL-10
- `e2e/bookings-roommate.e2e-spec.ts` — DAL-11, DAL-12
- `e2e/admin.e2e-spec.ts` — DAL-13, DAL-14, DAL-15

## Quy ước
- Mỗi User Story: **≥1 Happy · ≥2 Edge · ≥2 Error · ≥1 Integration**.
- Hiện dùng `it.todo(...)` → chưa fail khi chưa có code. Ở Bước 6 sẽ chuyển dần `it.todo` → `it(...)` thật khi implement từng task (fail-fast).
- Framework: **Jest + Supertest** (NestJS). Sẽ thêm `unit/` cho test service-level khi code.

## Quality Gate (Bước 7) trước khi commit
- 100% unit & integration test pass.
- Delta coverage (code mới) ≥ 80%.
- Lint + type-check sạch, không warning.
