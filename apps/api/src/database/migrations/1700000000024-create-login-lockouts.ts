import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bảng login_lockouts — khóa tạm luồng đăng nhập bằng ngày sinh (SV/tân SV)
 * theo định danh khi sai quá nhiều lần (chống brute-force ngày sinh).
 */
export class CreateLoginLockouts1700000000024 implements MigrationInterface {
  name = 'CreateLoginLockouts1700000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`login_lockouts\` (
        \`identifier\` VARCHAR(191) NOT NULL,
        \`failed_attempts\` INT NOT NULL DEFAULT 0,
        \`locked_until\` TIMESTAMP NULL,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`identifier\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`login_lockouts\`;`);
  }
}
