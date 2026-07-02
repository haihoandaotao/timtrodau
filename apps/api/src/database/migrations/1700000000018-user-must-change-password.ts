import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm cờ must_change_password cho users — bật khi cấp mật khẩu tạm (quên MK),
 * buộc người dùng đổi mật khẩu ở lần đăng nhập kế tiếp.
 */
export class UserMustChangePassword1700000000018 implements MigrationInterface {
  name = 'UserMustChangePassword1700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\`
        ADD COLUMN \`must_change_password\` TINYINT(1) NOT NULL DEFAULT 0;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`must_change_password\`;`);
  }
}
