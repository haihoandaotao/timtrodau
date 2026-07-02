import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Bảo mật HTTP headers. crossOriginResourcePolicy nới để phục vụ /uploads cho FE khác origin.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const prefix = config.get<string>('app.prefix') ?? 'api/v1';
  const port = config.get<number>('app.port') ?? 3001;
  const webOrigin = config.get<string>('app.webOrigin') ?? 'http://localhost:3000';
  const isProd = (config.get<string>('app.env') ?? 'development') === 'production';

  // Fail-fast: không cho chạy production với JWT secret mặc định/yếu.
  if (isProd) {
    const weak = [
      'change-me-access',
      'change-me-refresh',
      'dev-access-secret',
      'dev-refresh-secret',
    ];
    const access = config.get<string>('jwt.accessSecret') ?? '';
    const refresh = config.get<string>('jwt.refreshSecret') ?? '';
    if (
      weak.includes(access) ||
      weak.includes(refresh) ||
      access.length < 16 ||
      refresh.length < 16
    ) {
      throw new Error(
        'JWT_ACCESS_SECRET/JWT_REFRESH_SECRET chưa được cấu hình an toàn cho production ' +
          '(không được để mặc định, tối thiểu 16 ký tự). Hãy đặt secret ngẫu nhiên mạnh trong .env.',
      );
    }
  }

  app.setGlobalPrefix(prefix);

  // Validation toàn cục (class-validator) — whitelist chống dư field, transform DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Exception filter toàn cục — chuẩn hóa lỗi.
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({ origin: webOrigin, credentials: true });

  // Swagger / OpenAPI — chỉ bật ngoài production để không lộ API ra công khai.
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DAU Accommodation Link API')
      .setDescription('API hệ thống hỗ trợ tìm kiếm & đăng ký phòng trọ TSV DAU')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document);
  }

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    `🚀 DAL API: http://localhost:${port}/${prefix}` +
      (isProd ? '' : `  | Swagger: /${prefix}/docs`),
  );
}

void bootstrap();
