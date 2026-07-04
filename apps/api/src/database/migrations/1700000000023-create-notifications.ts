import { MigrationInterface, QueryRunner } from 'typeorm';

/** Bảng notifications — thông báo trong ứng dụng (chuông TopBar). */
export class CreateNotifications1700000000023 implements MigrationInterface {
  name = 'CreateNotifications1700000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`notifications\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`body\` VARCHAR(500) NULL,
        \`link\` VARCHAR(255) NULL,
        \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_notifications_user\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`notifications\`;`);
  }
}
