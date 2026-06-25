<!-- PR Template — CAIRA-DAU. Điền đầy đủ trước khi request review. -->

## 🔗 Liên kết
- **Jira:** <!-- DAL-XXX -->
- **Docs Host (Brief/Feature Plan):** <!-- link -->

## 📝 Mô tả thay đổi (What & Why)
<!-- Tóm tắt CÁI GÌ thay đổi và TẠI SAO. Không dán lại toàn bộ code. -->

## ✅ Loại thay đổi
- [ ] feat (tính năng mới)
- [ ] fix (sửa lỗi)
- [ ] refactor / chore / docs
- [ ] BREAKING CHANGE

## 🧪 Hướng dẫn test thủ công
<!-- Các bước reviewer/QC làm theo để kiểm chứng. -->
1.
2.

## 🗄️ Database / Migration
- [ ] Có migration mới (kèm `up()` + `down()`)
- [ ] Đã test `migration:run` và `migration:revert`
- [ ] Có seed thay đổi
- [ ] Không ảnh hưởng schema

## 📸 Screenshot / GIF (nếu có UI)
<!-- Kéo thả ảnh/GIF cho thay đổi giao diện. -->

## 🔒 Swagger / API
- [ ] Endpoint mới đã có `@ApiOperation` + `@ApiResponse` + ≥1 example
- [ ] Không có endpoint mới

## 🚦 Quality Gate
- [ ] 100% unit & integration test pass
- [ ] Delta coverage (code mới) ≥ 80%
- [ ] Lint + type-check sạch (0 warning)

## 👀 Ghi chú cho reviewer
<!-- Điểm cần chú ý, phần chưa làm, rủi ro, TODO follow-up. -->
