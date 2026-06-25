import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000000001 implements MigrationInterface {
  name = 'CreateUsers1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`student_code\` VARCHAR(32) NULL,
        \`full_name\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`email\` VARCHAR(191) NULL,
        \`password_hash\` VARCHAR(191) NULL,
        \`role\` ENUM('STUDENT','LANDLORD','ADMIN') NOT NULL DEFAULT 'STUDENT',
        \`status\` ENUM('ACTIVE','PENDING','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_users_phone\` (\`phone\`),
        UNIQUE INDEX \`uq_users_student_code\` (\`student_code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`users\`;`);
  }
}
