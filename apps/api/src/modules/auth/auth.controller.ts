import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';
import { LandlordRegisterDto } from './dto/landlord-register.dto';
import { LoginDto } from './dto/login.dto';
import { ProspectiveLoginDto } from './dto/prospective-login.dto';
import { ProspectiveRegisterDto } from './dto/prospective-register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'SV yêu cầu OTP đăng nhập',
    description: 'Sinh OTP gửi tới SĐT (MVP: provider mock log ra console).',
  })
  @ApiResponse({ status: 200, description: 'Đã gửi OTP', schema: { example: { requestId: '12' } } })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SV xác minh OTP → cấp JWT' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        tokens: { accessToken: 'eyJ...', refreshToken: 'eyJ...' },
        user: { id: '1', fullName: 'SV 2024110001', role: 'STUDENT', status: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'OTP sai/hết hạn/đã dùng' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
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
  @Post('landlord/register')
  @ApiOperation({
    summary: 'Chủ trọ đăng ký (chờ Admin duyệt)',
    description: 'Tạo tài khoản LANDLORD trạng thái PENDING kèm hồ sơ CCCD.',
  })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, chờ duyệt' })
  @ApiResponse({ status: 409, description: 'SĐT đã tồn tại' })
  registerLandlord(@Body() dto: LandlordRegisterDto) {
    return this.authService.registerLandlord(dto);
  }

  @Public()
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
}
