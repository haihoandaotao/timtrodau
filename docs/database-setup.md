# Hướng dẫn Setup Database (MySQL)

Phase 1.2 đã tạo xong **entities + 10 migration + seeds**. Để chạy được, cần MySQL.
Chọn 1 trong 2 cách:

## Cách 1 — Docker (khuyên dùng nếu có Docker)
```bash
# tại thư mục gốc dự án
docker compose up -d
# đợi container healthy (~15s)
```
File `docker-compose.yml` đã set: DB `dau_accommodation`, root password `devpass`, cổng 3306.

## Cách 2 — Cài MySQL trực tiếp (Windows)
1. Tải MySQL Community Server: https://dev.mysql.com/downloads/installer/
2. Cài, đặt mật khẩu root, đảm bảo service chạy ở cổng 3306.
3. Tạo database:
   ```sql
   CREATE DATABASE dau_accommodation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

## Cấu hình .env
```bash
# tại thư mục gốc, copy mẫu rồi sửa
cp .env.example .env
```
Sửa các dòng cho khớp:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=devpass        # hoặc mật khẩu bạn đặt
DB_DATABASE=dau_accommodation
```

## Chạy migration + seed
```bash
cd apps/api
npm run migration:run     # tạo 10 bảng theo thứ tự M1→M10
npm run seed              # seed areas, amenities, admin mặc định
```

Admin mặc định: phone `0900000000` / pass `Admin@123` (đổi ngay sau khi đăng nhập).

## Kiểm tra rollback (< 5 phút — chuẩn dự án)
```bash
npm run migration:revert   # chạy down() của migration mới nhất, lặp lại để revert dần
```

## Khởi động toàn hệ thống
```bash
# gốc dự án
npm run dev:api    # http://localhost:3001/api/v1  (Swagger: /api/v1/docs)
npm run dev:web    # http://localhost:3000
```
