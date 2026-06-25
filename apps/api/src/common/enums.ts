/** Enums dùng chung toàn hệ thống — khớp với cột ENUM trong migration. */

export enum UserRole {
  STUDENT = 'STUDENT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
}

export enum VerifyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AccommodationType {
  TRADITIONAL = 'TRADITIONAL', // phòng trọ truyền thống
  MINI_APT = 'MINI_APT', // căn hộ mini
  SHARED = 'SHARED', // ở ghép
}

export enum AccommodationStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONTACTED = 'CONTACTED',
  SUCCESS = 'SUCCESS',
  CANCELLED = 'CANCELLED',
}

export enum RoommatePostStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
