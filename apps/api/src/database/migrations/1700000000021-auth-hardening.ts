import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tăng cường bảo mật đăng nhập:
 * - users: mật khẩu tạm riêng (không ghi đè MK chính) + khóa tài khoản khi brute-force.
 * - otp_requests: đếm số lần nhập sai để vô hiệu hoá mã.
 */
export class AuthHardening1700000000021 implements MigrationInterface {
  name = 'AuthHardening1700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\`
        ADD COLUMN \`temp_password_hash\` VARCHAR(191) NULL,
        ADD COLUMN \`temp_password_expires_at\` TIMESTAMP NULL,
        ADD COLUMN \`failed_login_attempts\` INT NOT NULL DEFAULT 0,
        ADD COLUMN \`locked_until\` TIMESTAMP NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE \`otp_requests\` ADD COLUMN \`attempts\` INT NOT NULL DEFAULT 0;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`otp_requests\` DROP COLUMN \`attempts\`;`);
    await queryRunner.query(
      `ALTER TABLE \`users\`
        DROP COLUMN \`locked_until\`,
        DROP COLUMN \`failed_login_attempts\`,
        DROP COLUMN \`temp_password_expires_at\`,
        DROP COLUMN \`temp_password_hash\`;`,
    );
  }
}
