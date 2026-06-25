import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOtpRequests1700000000009 implements MigrationInterface {
  name = 'CreateOtpRequests1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`otp_requests\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`student_code\` VARCHAR(32) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`code_hash\` VARCHAR(191) NOT NULL,
        \`expires_at\` TIMESTAMP NOT NULL,
        \`consumed\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`otp_requests\`;`);
  }
}
