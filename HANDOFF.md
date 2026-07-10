# Bàn giao đưa hệ thống lên mạng (Deploy)

> Tài liệu dành cho chủ dự án (không chuyên CNTT) và lập trình viên (dev) triển khai.
> Chi tiết kỹ thuật đầy đủ xem [DEPLOY.md](DEPLOY.md).

## Tình trạng hiện tại
Phần mềm **đã hoàn thiện và kiểm thử** (build xanh, 57 test backend + 7 test frontend). Đã có sẵn cấu hình để đưa lên mạng bằng Docker (tự cài đặt cơ sở dữ liệu, chạy migration, cấp HTTPS). **Chỉ còn thiếu hạ tầng: một máy chủ, một tên miền, và vài thao tác của dev.**

---

## PHẦN A — Việc CHỦ DỰ ÁN cần chuẩn bị (không cần kỹ thuật)

### 1. Mua tên miền (domain)
- Ví dụ `dau-tro.vn` hoặc `.com`. Mua tại: Mắt Bão, PA Việt Nam, Nhân Hòa, GoDaddy…
- Chi phí ước tính: `.com` ~250–350k/năm, `.vn` ~350–750k/năm.

### 2. Thuê máy chủ (VPS)
- Cấu hình tối thiểu: **2GB RAM, 2 CPU, 40GB ổ cứng, hệ điều hành Ubuntu 22.04**.
- Nhà cung cấp gợi ý:
  - Trong nước (thanh toán dễ): **AZDIGI, Vietnix, Viettel IDC, VNPT** — ~120–200k/tháng.
  - Quốc tế (rẻ, mạnh): **DigitalOcean, Vultr, Hetzner** — ~5–6 USD/tháng.
- Khi thuê xong bạn sẽ nhận: **địa chỉ IP máy chủ + tài khoản đăng nhập (SSH)** → đưa cho dev.

### 3. Bàn giao cho dev
Gửi cho dev 4 thứ:
1. **Địa chỉ repo:** https://github.com/haihoandaotao/timtrodau
2. **Thông tin VPS** (IP + tài khoản SSH) và **tên miền** đã mua.
3. **File `.env.prod`** — chứa mật khẩu/bí mật, KHÔNG nằm trên GitHub. Gửi riêng cho dev (qua kênh an toàn). *(Chủ dự án: file này nằm sẵn trên máy đang phát triển, tên `.env.prod` ở thư mục gốc dự án.)*
4. **Tài liệu này** + [DEPLOY.md](DEPLOY.md).

### 4. Một việc nhỏ về Google (5 phút, có thể nhờ dev)
Đăng nhập Google Cloud Console (tài khoản đã tạo Client ID) → thêm tên miền thật vào phần **Authorized JavaScript origins** và bấm **Publish** màn hình đồng ý. (Để nút "Đăng nhập bằng Google" của chủ trọ chạy trên tên miền thật.)

---

## PHẦN B — Việc DEV cần làm (kỹ thuật, ~30–60 phút)

Tất cả đã được đóng gói sẵn; dev chỉ cần làm theo [DEPLOY.md](DEPLOY.md). Tóm tắt:

1. **Trỏ DNS:** tạo 2 bản ghi A → IP VPS: `ten-mien.vn` và `api.ten-mien.vn`.
2. **Cài Docker** trên VPS: `curl -fsSL https://get.docker.com | sh`.
3. **Lấy mã nguồn:** `git clone https://github.com/haihoandaotao/timtrodau.git && cd timtrodau`.
4. **Đưa file `.env.prod`** (chủ dự án gửi) vào thư mục gốc; sửa 4 dòng domain (`WEB_DOMAIN`, `API_DOMAIN`, `NEXT_PUBLIC_API_BASE_URL`, `WEB_ORIGIN`) theo tên miền thật. *(JWT secret, mật khẩu DB, Gmail, Google Client ID, khóa tuyển sinh đã điền sẵn.)*
5. **Cập nhật Google OAuth** (Phần A mục 4) nếu chủ dự án chưa làm.
6. **Khởi chạy:** `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build` (migration tự chạy, Caddy tự cấp HTTPS).
7. **Tạo admin:** `docker compose -f docker-compose.prod.yml --env-file .env.prod exec api npm run seed:prod`.
8. **Kiểm tra:** mở `https://ten-mien.vn`, đăng nhập admin (SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD trong `.env.prod`) rồi **đổi mật khẩu ngay**; bấm "Đồng bộ tuyển sinh".
9. **Nên làm:** đặt lịch backup DB (`mysqldump`, xem DEPLOY.md) và bật `restart: unless-stopped` (đã có sẵn).

### Lưu ý cho dev
- Dev hiện chạy dev trên **MariaDB**, production dùng **MySQL 8**. Nên chạy `docker compose` một lần trên môi trường có Docker để chắc chắn migration chạy sạch trên MySQL 8 trước khi go-live.
- **Không commit `.env.prod`** lên Git (đã có trong `.gitignore`).
- Dữ liệu production bắt đầu mới; danh sách thí sinh lấy lại bằng nút "Đồng bộ tuyển sinh".

---

## Ước tính chi phí vận hành
- Tên miền: ~300–700k/năm.
- VPS: ~120–200k/tháng (trong nước) hoặc ~5–6 USD/tháng (quốc tế).
- Email (Gmail) & Google login: miễn phí.
