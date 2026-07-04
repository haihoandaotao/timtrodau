import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { ProspectiveLoginDto } from './dto/prospective-login.dto';
import { ProspectiveRegisterDto } from './dto/prospective-register.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshDto } from './dto/refresh.dto';
import { StudentLoginDto } from './dto/student-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('prospective/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tân sinh viên đăng nhập (email/SĐT + ngày sinh)',
    description: 'Mật khẩu là ngày sinh; xác thực với hệ thống tuyển sinh (mock).',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Sai email/SĐT hoặc ngày sinh' })
  prospectiveLogin(@Body() dto: ProspectiveLoginDto) {
    return this.authService.prospectiveLogin(dto);
  }

  @Public()
  @Post('prospective/register')
  @ApiOperation({
    summary: 'Thí sinh tự đăng ký (chưa có trong hệ thống tuyển sinh)',
    description: 'Tạo tài khoản tân SV bằng email/SĐT + ngày sinh + ngành dự kiến, đăng nhập luôn.',
  })
  @ApiResponse({ status: 201, description: 'Đăng ký & đăng nhập thành công' })
  @ApiResponse({ status: 409, description: 'Email/SĐT đã tồn tại' })
  prospectiveRegister(@Body() dto: ProspectiveRegisterDto) {
    return this.authService.prospectiveRegister(dto);
  }

  @Public()
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('student/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sinh viên trường đăng nhập (MSSV + ngày sinh)',
    description: 'Mật khẩu là ngày sinh (yyyy-mm-dd).',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Sai MSSV/ngày sinh' })
  studentLogin(@Body() dto: StudentLoginDto) {
    return this.authService.studentLogin(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chủ trọ đăng nhập/đăng ký bằng Google (một chạm)',
    description: 'Xác minh Google ID token; tạo tài khoản LANDLORD (PENDING) nếu chưa có.',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Token Google không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email đã dùng cho tài khoản sinh viên' })
  @ApiResponse({ status: 503, description: 'Chưa cấu hình Google' })
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto.idToken);
  }

  @Public()
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập chủ trọ/admin (SĐT + mật khẩu)' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Sai thông tin đăng nhập' })
  @ApiResponse({ status: 403, description: 'Tài khoản chưa kích hoạt / SV phải dùng OTP' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 4, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quên mật khẩu — gửi mật khẩu tạm qua email (chủ trọ/admin)',
    description: 'Cấp mật khẩu tạm mới rồi gửi email; buộc đổi mật khẩu ở lần đăng nhập kế.',
  })
  @ApiResponse({ status: 200, description: 'Đã xử lý (thông báo chung, không lộ email tồn tại)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiResponse({ status: 200, description: 'Token mới' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Thông tin người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Hồ sơ user' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  @ApiResponse({ status: 409, description: 'Email/SĐT trùng' })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu (chủ trọ/admin)' })
  @ApiResponse({ status: 200, description: 'Đổi thành công' })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu hiện tại sai / tài khoản không dùng mật khẩu',
  })
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user, dto);
  }
}
