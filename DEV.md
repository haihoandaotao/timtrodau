# Hướng dẫn cho Developer (dev & bàn giao)

Mục tiêu: bất kỳ máy nào clone về cũng chạy được **giống hệt nhau** — DB chạy trong Docker (MySQL 8), API/Web chạy bằng npm.

## Yêu cầu cài đặt
- **Node.js 18+**
- **Docker Desktop** (Windows cần bật WSL2). Kiểm tra: `docker version` chạy được.

> Máy dev hiện tại đang dùng MariaDB portable đặt tay — xem mục "Chuyển máy này sang MySQL 8" ở cuối để đồng bộ.

## Khởi động lần đầu (máy mới clone)
```bash
git clone <repo> && cd dau-accommodation-link
cp .env.example apps/api/.env      # điền GMAIL_*, INTEGRATION_API_KEY nếu cần
npm run setup                      # cài deps + bật DB Docker + migrate + seed
npm run dev                        # chạy API (3001) + Web (3000)
```
Mở http://localhost:3000. Đăng nhập admin bằng tài khoản seed (mặc định `0900000000` / `Admin@123` — đổi ngay).

`npm run setup` = `npm install` + `db:up` (chờ DB healthy) + `db:migrate` + `db:seed`.

## Các lệnh npm tiện dụng
| Lệnh | Việc |
|------|------|
| `npm run db:up` | Bật DB MySQL 8 trong Docker (chờ sẵn sàng) |
| `npm run db:down` | Tắt DB (giữ dữ liệu) |
| `npm run db:reset` | Xoá sạch DB + tạo lại (mất dữ liệu) |
| `npm run db:logs` | Xem log DB |
| `npm run db:migrate` | Chạy migration |
| `npm run db:seed` | Tạo dữ liệu mẫu (admin, ngành…) |
| `npm run dev` | Chạy API + Web (hot-reload) |
| `npm run build` | Build cả API + Web |

DB chạy ở container `dal-mysql` (cổng 3306, user `root`, mật khẩu `devpass`, database `dau_accommodation`), dữ liệu lưu ở volume `dal_mysql_data` — không mất khi `db:down`.

## Deploy production
Xem [DEPLOY.md](DEPLOY.md). Prod dùng `docker-compose.prod.yml` (MySQL 8 — **cùng engine với dev**, không lệch môi trường), migration tự chạy khi API khởi động.

---

## Chuyển máy hiện tại: MariaDB → MySQL 8 (Docker)

Máy này đang chạy MariaDB portable ở `C:\Users\This PC\dau-db`. Để đồng bộ về MySQL 8 Docker:

**1. Cài Docker Desktop** rồi mở (đảm bảo `docker version` chạy được).

**2. (Tuỳ chọn) Giữ lại dữ liệu test tự tạo** — phần lớn dữ liệu KHÔNG cần cứu vì:
- Thí sinh tuyển sinh (4946): lấy lại bằng nút **Đồng bộ tuyển sinh**.
- Admin, ngành, khu vực, banner: do seed/migration tạo lại.
Chỉ dữ liệu bạn tự nhập tay (vài phòng/tin ở ghép mẫu) là mất.

**3. Tắt MariaDB cũ để giải phóng cổng 3306:**
```powershell
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
```

**4. Trỏ app sang DB Docker** — sửa `apps/api/.env`:
```
DB_PASSWORD=devpass
```

**5. Bật DB Docker + tạo schema + dữ liệu mẫu:**
```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```
Đăng nhập admin → bấm **Đồng bộ tuyển sinh** để lấy lại danh sách thí sinh.

> Sau khi chuyển xong, `C:\Users\This PC\dau-db` và bước khởi động MariaDB trong `restart-all.ps1` không còn cần nữa (có thể xoá dòng đó).

### (Nâng cao) Giữ NGUYÊN toàn bộ dữ liệu cũ
Nếu bắt buộc giữ mọi dữ liệu, sau bước 5 (đã có schema) nạp thêm phần dữ liệu:
```powershell
# Dump CHỈ dữ liệu từ MariaDB (bỏ 2 bảng migration đã seed để tránh trùng khoá)
& "C:\Users\This PC\dau-db\mariadb-11.4.3-winx64\bin\mysqldump.exe" -u root -h 127.0.0.1 `
  --no-create-info --skip-triggers --default-character-set=utf8mb4 `
  --ignore-table=dau_accommodation.banner_slides `
  --ignore-table=dau_accommodation.app_settings `
  --ignore-table=dau_accommodation.migrations `
  dau_accommodation > data.sql

# Nạp vào MySQL 8 (tắt kiểm tra khoá ngoại khi import)
docker exec -i dal-mysql sh -c "exec mysql -uroot -pdevpass dau_accommodation --init-command='SET FOREIGN_KEY_CHECKS=0'" < data.sql
```
Lưu ý: chạy `db:seed` TRƯỚC bước này có thể gây trùng khoá ở một số bảng seed — nếu vướng, dùng `db:reset` rồi chỉ `db:migrate` (không seed) trước khi nạp `data.sql`.
