/**
 * Unit test RolesGuard (DAL-4) — không cần DB.
 */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';
import { AuthUser } from '../interfaces/jwt-payload.interface';
import { RolesGuard } from './roles.guard';

function mockContext(user?: Partial<AuthUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('Không gắn @Roles → cho qua (chỉ cần đăng nhập)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ id: '1', role: UserRole.STUDENT, phone: '0' }))).toBe(
      true,
    );
  });

  it('T4-H1 (Happy): ADMIN gọi route yêu cầu ADMIN → cho qua', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockContext({ id: '1', role: UserRole.ADMIN, phone: '0' }))).toBe(
      true,
    );
  });

  it('T4-X2 (Error): STUDENT gọi route ADMIN → Forbidden', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      guard.canActivate(mockContext({ id: '1', role: UserRole.STUDENT, phone: '0' })),
    ).toThrow(ForbiddenException);
  });

  it('Error: không có user (chưa auth) → Forbidden', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext(undefined))).toThrow(ForbiddenException);
  });
});
