import { UserRole } from '../enums';

/** Payload trong JWT access token. */
export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  phone: string;
}

/** User đã xác thực, gắn vào request sau khi qua JwtAuthGuard. */
export interface AuthUser {
  id: string;
  role: UserRole;
  phone: string;
}
