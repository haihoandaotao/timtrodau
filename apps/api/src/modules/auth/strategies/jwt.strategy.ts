import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '../../../common/enums';
import { AuthUser, JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') ?? 'change-me-access',
    });
  }

  /**
   * Kiểm tra lại tài khoản mỗi request: token cũ mất hiệu lực ngay khi
   * tài khoản bị khóa/hủy duyệt (status != ACTIVE), không chờ hết hạn token.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub);
    // Chặn ngay tài khoản bị khóa (BLOCKED); PENDING vẫn vào được để hoàn thiện hồ sơ.
    if (!user || user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    return { id: user.id, role: user.role, phone: user.phone };
  }
}
