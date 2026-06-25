import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - majors: danh sách ngành nhập học (admin cấu hình).
 * - admission_candidates: đổi sang đăng nhập email/SĐT + ngày sinh + tự đăng ký
 *   (thay luồng SBD + mật khẩu ở M11).
 */
export class MajorsAndProspective1700000000012 implements MigrationInterface {
  name = 'MajorsAndProspective1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`majors\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_majors_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Reshape admission_candidates (mock dev — dữ liệu mẫu sẽ seed lại).
    await queryRunner.query(`DROP TABLE \`admission_candidates\`;`);
    await queryRunner.query(`
      CREATE TABLE \`admission_candidates\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`full_name\` VARCHAR(191) NOT NULL,
        \`email\` VARCHAR(191) NULL,
        \`phone\` VARCHAR(20) NULL,
        \`date_of_birth\` DATE NOT NULL,
        \`intended_major\` VARCHAR(100) NULL,
        \`is_self_registered\` TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_admission_email\` (\`email\`),
        UNIQUE INDEX \`uq_admission_phone\` (\`phone\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`admission_candidates\`;`);
    await queryRunner.query(`
      CREATE TABLE \`admission_candidates\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`sbd\` VARCHAR(32) NOT NULL,
        \`full_name\` VARCHAR(191) NOT NULL,
        \`password_hash\` VARCHAR(191) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_admission_sbd\` (\`sbd\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await queryRunner.query(`DROP TABLE \`majors\`;`);
  }
}
