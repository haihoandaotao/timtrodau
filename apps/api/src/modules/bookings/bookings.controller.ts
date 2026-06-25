import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Roles(UserRole.STUDENT)
  @Post()
  @ApiOperation({
    summary: 'SV đăng ký giữ chỗ',
    description: 'Ghi nhận booking in-app + trả contact (zalo/phone) để deep-link liên hệ chủ trọ.',
  })
  @ApiResponse({
    status: 201,
    description: 'Đã giữ chỗ',
    schema: {
      example: {
        booking: { id: '1', status: 'PENDING' },
        contact: { phone: '0905123456', zalo: 'https://zalo.me/0905123456' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại/chưa duyệt' })
  @ApiResponse({ status: 409, description: 'Phòng đã hết' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.service.create(user.id, dto);
  }

  @Roles(UserRole.STUDENT)
  @Get('mine')
  @ApiOperation({ summary: 'SV xem lịch sử giữ chỗ' })
  @ApiResponse({ status: 200, description: 'Danh sách booking của SV' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findMine(user.id);
  }
}
