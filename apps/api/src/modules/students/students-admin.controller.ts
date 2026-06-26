import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { StudentsAdminService } from './students-admin.service';

@ApiTags('Admin - Students')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/students')
export class StudentsAdminController {
  constructor(private readonly service: StudentsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sinh viên trường (tìm kiếm + lọc ngành/khoá, phân trang)' })
  @ApiQuery({ name: 'q', required: false, description: 'Tìm theo MSSV hoặc họ tên' })
  @ApiQuery({ name: 'major', required: false })
  @ApiQuery({ name: 'cohort', required: false, description: '2 ký tự đầu MSSV, vd 18' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Danh sách phân trang' })
  list(
    @Query('q') q?: string,
    @Query('major') major?: string,
    @Query('cohort') cohort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.list({
      q,
      major,
      cohort,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê số sinh viên theo ngành và theo khoá' })
  @ApiResponse({ status: 200, description: 'total + byMajor + byCohort' })
  stats() {
    return this.service.stats();
  }
}
