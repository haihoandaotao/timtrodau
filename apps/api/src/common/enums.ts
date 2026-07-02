/** Enums dùng chung toàn hệ thống — khớp với cột ENUM trong migration. */

export enum UserRole {
  STUDENT = 'STUDENT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

/** Phân loại sinh viên trong app. */
export enum StudentType {
  PROSPECTIVE = 'PROSPECTIVE', // tân sinh viên (thí sinh đang chờ nhập học)
  CURRENT = 'CURRENT', // sinh viên đang học của trường
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

/** Giới tính bạn ở ghép mong muốn. */
export enum RoommateGenderPref {
  ANY = 'ANY', // không yêu cầu
  MALE = 'MALE', // tìm nam
  FEMALE = 'FEMALE', // tìm nữ
}
