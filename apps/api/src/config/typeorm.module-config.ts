/**
 * TypeOrmModule async config — đọc từ ConfigService.
 * synchronize luôn false ở production; chỉ migration điều khiển schema.
 */
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const typeOrmModuleConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get<string>('db.host'),
  port: config.get<number>('db.port'),
  username: config.get<string>('db.username'),
  password: config.get<string>('db.password'),
  database: config.get<string>('db.database'),
  synchronize: config.get<boolean>('db.synchronize') ?? false,
  logging: config.get<boolean>('db.logging') ?? false,
  autoLoadEntities: true,
  entities: [join(__dirname, '..', 'modules', '**', 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
});
