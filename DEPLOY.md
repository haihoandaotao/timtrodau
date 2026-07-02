# Hướng dẫn Deploy — DAU Accommodation Link

Stack production gồm 4 service chạy bằng Docker Compose:

| Service | Vai trò | Cổng |
|---------|---------|------|
| `mysql` | Cơ sở dữ liệu MySQL 8 | nội bộ |
| `api`   | NestJS API (tự chạy migration khi khởi động) | nội bộ 3001 |
| `web`   | Next.js (giao diện người dùng) | nội bộ 3000 |
| `caddy` | Reverse proxy + HTTPS tự động (Let's Encrypt) | 80, 443 |

Chỉ Caddy mở cổng ra Internet; API/Web/DB chạy trong mạng nội bộ của Compose.

---

## 1. Chuẩn bị máy chủ

- 1 VPS (khuyến nghị ≥ 2GB RAM), cài **Docker** + **Docker Compose plugin**.
- Mở firewall cổng **80** và **443**.
- Trỏ **2 bản ghi DNS (A record)** về IP máy chủ:
  - `dau-tro.vn` → web
  - `api.dau-tro.vn` → API
  (thay bằng domain thật của bạn)

## 2. Lấy mã nguồn + cấu hình

```bash
git clone <repo> && cd dau-accommodation-link
cp .env.prod.example .env.prod
nano .env.prod          # điền giá trị thật
```

Bắt buộc đổi trong `.env.prod`:
- `WEB_DOMAIN`, `API_DOMAIN` — domain thật.
- `NEXT_PUBLIC_API_BASE_URL` = `https://<API_DOMAIN>/api/v1` (nhúng lúc build web).
- `WEB_ORIGIN` = `https://<WEB_DOMAIN>` (CORS).
- `DB_PASSWORD` — mật khẩu MySQL mạnh.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — chuỗi ngẫu nhiên (`openssl rand -base64 48`).
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_NOTIFY_EMAIL` — để gửi email thật.
- `INTEGRATION_API_KEY` — khóa API tuyển sinh.
- `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD` — admin đầu tiên.

## 3. Build & khởi chạy

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

- Migration **tự chạy** khi container API khởi động (xem `apps/api/docker-entrypoint.sh`).
- Caddy tự xin chứng chỉ HTTPS cho 2 domain (cần DNS đã trỏ đúng + cổng 80/443 mở).

## 4. Tạo tài khoản admin (chỉ lần đầu)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api npm run seed:prod
```

Sau đó đăng nhập bằng `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` rồi **đổi mật khẩu ngay** trong Hồ sơ.

## 5. Kiểm tra

- `https://dau-tro.vn` — trang chủ hiển thị.
- Đăng nhập admin → Dashboard có số liệu.
- Đăng bài + upload ảnh (ảnh tự nén < 2MB), thử "Quên mật khẩu".
- Swagger `/api/v1/docs` đã **tắt** ở production (chỉ bật khi `NODE_ENV != production`).

---

## Vận hành

**Cập nhật phiên bản mới:**
```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
Migration mới (nếu có) tự chạy khi API khởi động lại.

**Xem log:**
```bash
docker compose -f docker-compose.prod.yml logs -f api
```

**Sao lưu / phục hồi database:**
```bash
# Backup
docker compose -f docker-compose.prod.yml exec mysql \
  mysqldump -uroot -p"$DB_PASSWORD" dau_accommodation > backup.sql
# Restore
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -uroot -p"$DB_PASSWORD" dau_accommodation < backup.sql
```

## Dữ liệu được giữ qua redeploy (named volumes)

- `dal_mysql_data` — dữ liệu MySQL.
- `dal_uploads` — **ảnh upload** (mount vào `/app/apps/api/uploads`). Đừng xóa volume này.
- `dal_caddy_data` — chứng chỉ HTTPS.

## Lưu ý

- Chỉ chạy **1 instance API** (cron đồng bộ tuyển sinh 7h sáng + cron không nên chạy trùng).
- Email chạy chế độ mock (chỉ log) nếu chưa điền `GMAIL_USER`/`GMAIL_APP_PASSWORD`.
- Nếu đã có sẵn reverse proxy/Nginx riêng: bỏ service `caddy`, tự publish cổng `api`/`web` và proxy thủ công. Khi đó route `API_DOMAIN` → `api:3001` (gồm cả `/api/v1` và `/uploads`), `WEB_DOMAIN` → `web:3000`.
