import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const prefix = config.get<string>('app.prefix') ?? 'api/v1';
  const port = config.get<number>('app.port') ?? 3001;
  const webOrigin = config.get<string>('app.webOrigin') ?? 'http://localhost:3000';

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

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DAU Accommodation Link API')
    .setDescription('API hệ thống hỗ trợ tìm kiếm & đăng ký phòng trọ TSV DAU')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 DAL API: http://localhost:${port}/${prefix}  | Swagger: /${prefix}/docs`);
}

void bootstrap();
