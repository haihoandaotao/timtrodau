# Feature Plan — DAU Accommodation Link

> **Loại tài liệu:** Architecture & Design (Bước 3 — `/sc:design`)
> **Trạng thái:** Draft v1.0 — chờ Kỹ sư duyệt trước khi sang Bước 4 (Test-Design)
> **Ngày:** 2026-06-25 · **Persona:** Architect
> **Tham chiếu:** [brief.md](../brief.md)
> **Giả định mặc định đã áp dụng (phương án A):** MSSV tự khai + OTP · `OtpService` mock khi dev · "uy tín" = cờ Admin + đếm booking · Dashboard query khi tải + nút refresh · chỉ tiếng Việt · 1 VPS Linux.

---

## 1. Kiến trúc tổng quan (System Architecture)

### 1.1 Sơ đồ thành phần (Component Diagram)

```mermaid
graph TB
    subgraph Client["Client (Mobile-first Web)"]
        SV["Phân hệ Sinh viên<br/>Next.js App Router"]
        CT["Phân hệ Chủ trọ<br/>Next.js App Router"]
        AD["Phân hệ Admin<br/>Next.js App Router"]
    end

    subgraph Frontend["Next.js (BFF/SSR)"]
        SL["Service Layer<br/>/lib/api (TanStack Query)"]
    end

    subgraph Backend["NestJS API (module hóa)"]
        GW["Global Layer<br/>JwtAuthGuard · RolesGuard · HttpExceptionFilter · ValidationPipe"]
        M_AUTH["AuthModule<br/>MSSV+OTP, JWT"]
        M_USER["UsersModule"]
        M_ACC["AccommodationsModule"]
        M_BOOK["BookingsModule"]
        M_ROOM["RoommateModule (ở ghép)"]
        M_MOD["ModerationModule (duyệt tin)"]
        M_STAT["StatsModule (dashboard)"]
        M_FILE["FilesModule (StorageService)"]
        M_NOTI["NotifyModule (OtpService + thông báo)"]
    end

    subgraph Data["Hạ tầng dữ liệu"]
        DB[("MySQL<br/>TypeORM")]
        FS["Local Static Storage<br/>/uploads (static serve)"]
    end

    subgraph External["Dịch vụ ngoài"]
        SMS["SMS/OTP Provider<br/>(eSMS/Twilio/ZNS - mock dev)"]
        MAPS["Google Maps API"]
        ZALO["Zalo / Tel deep-link"]
    end

    SV --> SL
    CT --> SL
    AD --> SL
    SL -->|REST/JSON + JWT| GW
    GW --> M_AUTH & M_USER & M_ACC & M_BOOK & M_ROOM & M_MOD & M_STAT & M_FILE & M_NOTI
    M_AUTH & M_USER & M_ACC & M_BOOK & M_ROOM & M_MOD & M_STAT --> DB
    M_FILE --> FS
    M_NOTI --> SMS
    SV -.bản đồ.-> MAPS
    SV -.liên hệ nhanh.-> ZALO
```

### 1.2 Luồng "Đăng ký giữ chỗ" (Sequence Diagram)

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant FE as Next.js
    participant API as NestJS (BookingsModule)
    participant DB as MySQL
    participant N as NotifyModule
    participant CT as Chủ trọ

    SV->>FE: Ấn "Đăng ký tư vấn / Giữ chỗ"
    FE->>API: POST /bookings {accommodationId} (JWT)
    API->>DB: Kiểm tra phòng PUBLISHED & còn phòng
    alt Phòng hợp lệ
        API->>DB: INSERT booking (status=PENDING)
        API->>N: Gửi thông báo chủ trọ + đội hỗ trợ
        N-->>CT: Email/notification
        API-->>FE: 201 {bookingId, contact: {zalo, phone}}
        FE-->>SV: Hiện xác nhận + nút deep-link Zalo/Gọi
    else Hết phòng / chưa duyệt
        API-->>FE: 409 Conflict
        FE-->>SV: Thông báo phòng không khả dụng
    end
```

### 1.3 Luồng "Đăng nhập MSSV + OTP" (Sequence Diagram)

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant FE as Next.js
    participant API as AuthModule
    participant N as NotifyModule(OtpService)
    participant DB as MySQL

    SV->>FE: Nhập MSSV/SBD + SĐT
    FE->>API: POST /auth/otp/request {studentCode, phone}
    API->>DB: Lưu otp_code (hash) + expiry (5 phút)
    API->>N: Gửi OTP qua SMS (mock log khi dev)
    API-->>FE: 200 {requestId}
    SV->>FE: Nhập mã OTP
    FE->>API: POST /auth/otp/verify {requestId, code}
    API->>DB: Kiểm tra hash + expiry, upsert User(role=STUDENT)
    API-->>FE: 200 {accessToken, refreshToken, user}
```

### 1.4 Quyết định kiến trúc (Architecture Decisions)

| # | Quyết định | Lý do (WHY) |
|---|---|---|
| AD-1 | NestJS module hóa theo domain | Tách bạch, dễ test, đúng chuẩn dự án |
| AD-2 | `StorageService` interface (local impl trước) | Swap sang S3/Cloudinary sau không sửa business logic |
| AD-3 | `OtpService` interface + provider mock dev | Không phụ thuộc SMS provider khi phát triển/test |
| AD-4 | RBAC qua `@Roles` + `RolesGuard` | 3 vai trò rạch ròi, bảo vệ dữ liệu CCCD |
| AD-5 | Soft delete (`deleted_at`) toàn bộ bảng nghiệp vụ | Phục hồi dữ liệu, audit |
| AD-6 | Bài đăng có `status` (DRAFT/PENDING/PUBLISHED/REJECTED/HIDDEN) | Bắt buộc duyệt trước khi công khai (chống lừa đảo) |
| AD-7 | Tọa độ lưu `decimal(10,7)` lat/lng | Đủ chính xác cho bản đồ; lọc khoảng cách tính ở app-layer (MVP) |

---

## 2. Data Model

### 2.1 ERD

```mermaid
erDiagram
    USERS ||--o{ ACCOMMODATIONS : "owns (landlord)"
    USERS ||--o{ BOOKINGS : "registers (student)"
    USERS ||--o| LANDLORD_PROFILES : "has"
    USERS ||--o| STUDENT_PROFILES : "has"
    ACCOMMODATIONS ||--o{ IMAGES : "has"
    ACCOMMODATIONS ||--o{ BOOKINGS : "receives"
    ACCOMMODATIONS }o--|| AREAS : "located in"
    ACCOMMODATIONS ||--o{ ACCOMMODATION_AMENITIES : ""
    AMENITIES ||--o{ ACCOMMODATION_AMENITIES : ""
    USERS ||--o{ ROOMMATE_POSTS : "creates"
    USERS ||--o{ OTP_REQUESTS : "requests"

    USERS {
        bigint id PK
        varchar student_code "nullable, unique"
        varchar full_name
        varchar phone "unique"
        varchar email "nullable"
        enum role "STUDENT|LANDLORD|ADMIN"
        enum status "ACTIVE|PENDING|BLOCKED"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }
    STUDENT_PROFILES {
        bigint id PK
        bigint user_id FK
        varchar major "ngành học"
        smallint enrollment_year
    }
    LANDLORD_PROFILES {
        bigint id PK
        bigint user_id FK
        varchar id_card_no "CCCD - hạn chế xem"
        varchar id_card_image_url
        varchar address
        boolean is_trusted "cờ Admin"
        int verified_booking_count
        enum verify_status "PENDING|APPROVED|REJECTED"
    }
    AREAS {
        int id PK
        varchar name "Hòa Xuân, Khuê Trung..."
        decimal center_lat
        decimal center_lng
    }
    ACCOMMODATIONS {
        bigint id PK
        bigint landlord_id FK
        varchar title
        text description
        decimal price "VND/tháng"
        enum type "TRADITIONAL|MINI_APT|SHARED"
        varchar address
        int area_id FK
        decimal lat
        decimal lng
        decimal distance_km "tới trường"
        json extra_costs "điện/nước/vệ sinh/mạng"
        boolean is_available "toggle còn/hết"
        enum status "DRAFT|PENDING|PUBLISHED|REJECTED|HIDDEN"
        text reject_reason "nullable"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    IMAGES {
        bigint id PK
        bigint accommodation_id FK
        varchar url
        enum media_type "IMAGE|VIDEO"
        smallint sort_order
    }
    AMENITIES {
        int id PK
        varchar code "WIFI|AIRCON|FREE_HOURS|MEZZANINE|WASHER"
        varchar label
    }
    ACCOMMODATION_AMENITIES {
        bigint accommodation_id FK
        int amenity_id FK
    }
    BOOKINGS {
        bigint id PK
        bigint student_id FK
        bigint accommodation_id FK
        enum status "PENDING|CONTACTED|SUCCESS|CANCELLED"
        text note
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    ROOMMATE_POSTS {
        bigint id PK
        bigint student_id FK
        varchar major "lọc theo ngành"
        decimal budget
        int preferred_area_id FK
        text description
        enum status "OPEN|CLOSED"
        timestamp created_at
    }
    OTP_REQUESTS {
        bigint id PK
        varchar student_code
        varchar phone
        varchar code_hash
        timestamp expires_at
        boolean consumed
        timestamp created_at
    }
```

### 2.2 Ghi chú thiết kế bảng

- **Naming convention** (chuẩn dự án): table `snake_case` số nhiều; column `snake_case`; index `idx_<table>_<column>`.
- **Cột bắt buộc**: mọi bảng nghiệp vụ có `created_at` (`@CreateDateColumn`), `updated_at` (`@UpdateDateColumn`); soft delete `deleted_at` (`@DeleteDateColumn`) cho `users`, `accommodations`, `bookings`.
- **Index dự kiến**: `idx_users_phone`, `idx_users_student_code`, `idx_accommodations_status`, `idx_accommodations_area_id`, `idx_accommodations_price`, `idx_bookings_student_id`, `idx_bookings_accommodation_id`, `idx_otp_requests_phone`.
- **Dữ liệu nhạy cảm**: `landlord_profiles.id_card_no` & `id_card_image_url` chỉ Admin xem (không trả về API công khai); cân nhắc mã hóa cột giai đoạn 2.
- **Amenities & Areas** là bảng tra cứu (seed sẵn) → tách `src/database/seeds/`.
- **extra_costs** dùng JSON: `{ electricity, water, sanitation, internet }` (đơn vị VND, mô tả linh hoạt).

---

*(Tiếp theo: API Contract, Rollback plan & phân rã Jira — xem [feature-plan-api.md](./feature-plan-api.md))*
