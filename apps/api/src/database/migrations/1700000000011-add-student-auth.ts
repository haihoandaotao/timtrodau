import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hỗ trợ 2 loại sinh viên (tân SV qua tuyển sinh + SV trường qua MSSV/ngày sinh):
 * - users.phone → nullable (SV đăng nhập bằng SBD/MSSV có thể chưa có SĐT).
 * - student_profiles thêm student_type + intended_major.
 * - 2 bảng mock "hệ thống ngoài": admission_candidates, student_records.
 */
export class AddStudentAuth1700000000011 implements MigrationInterface {
  name = 'AddStudentAuth1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`phone\` VARCHAR(20) NULL;`);

    await queryRunner.query(
      `ALTER TABLE \`student_profiles\`
        ADD COLUMN \`student_type\` ENUM('PROSPECTIVE','CURRENT') NOT NULL DEFAULT 'CURRENT',
        ADD COLUMN \`intended_major\` VARCHAR(100) NULL;`,
    );

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

    await queryRunner.query(`
      CREATE TABLE \`student_records\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`student_code\` VARCHAR(32) NOT NULL,
        \`full_name\` VARCHAR(191) NOT NULL,
        \`major\` VARCHAR(100) NULL,
        \`date_of_birth\` DATE NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_student_record_code\` (\`student_code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`student_records\`;`);
    await queryRunner.query(`DROP TABLE \`admission_candidates\`;`);
    await queryRunner.query(
      `ALTER TABLE \`student_profiles\` DROP COLUMN \`intended_major\`, DROP COLUMN \`student_type\`;`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`phone\` VARCHAR(20) NULL;`);
  }
}
