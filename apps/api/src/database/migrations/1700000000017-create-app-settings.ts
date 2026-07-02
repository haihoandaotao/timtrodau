import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bảng app_settings (key-value) — cấu hình hệ thống chỉnh từ UI Admin.
 * Khoá đầu tiên: moderation.auto_approve (bật/tắt tự động duyệt bài).
 */
export class CreateAppSettings1700000000017 implements MigrationInterface {
  name = 'CreateAppSettings1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`app_settings\` (
        \`setting_key\` VARCHAR(100) NOT NULL,
        \`setting_value\` VARCHAR(255) NOT NULL,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`setting_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    );
    await queryRunner.query(
      `INSERT INTO \`app_settings\` (\`setting_key\`, \`setting_value\`)
        VALUES ('moderation.auto_approve', 'false');`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`app_settings\`;`);
  }
}
