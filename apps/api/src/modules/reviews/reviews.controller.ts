import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuthUser } from '../../common/interfaces/jwt-payload.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'SV đánh giá chủ trọ (sau khi giữ chỗ thành công)' })
  @ApiResponse({ status: 201, description: 'Đã đánh giá' })
  @ApiResponse({ status: 403, description: 'Chưa giữ chỗ thành công' })
  @ApiResponse({ status: 409, description: 'Đã đánh giá chủ trọ này' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.service.create(user.id, dto);
  }

  @Public()
  @Get('by-accommodation/:accId')
  @ApiOperation({ summary: 'Điểm trung bình + đánh giá của chủ trọ (theo phòng)' })
  @ApiResponse({ status: 200, description: 'average + count + items' })
  byAccommodation(@Param('accId') accId: string) {
    return this.service.byAccommodation(accId);
  }
}
