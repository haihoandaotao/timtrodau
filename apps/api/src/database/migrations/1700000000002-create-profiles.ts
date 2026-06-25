import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfiles1700000000002 implements MigrationInterface {
  name = 'CreateProfiles1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`student_profiles\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NOT NULL,
        \`major\` VARCHAR(100) NULL,
        \`enrollment_year\` SMALLINT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_student_profiles_user\` (\`user_id\`),
        CONSTRAINT \`fk_student_profiles_user\` FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE \`landlord_profiles\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NOT NULL,
        \`id_card_no\` VARCHAR(20) NOT NULL,
        \`id_card_image_url\` VARCHAR(255) NULL,
        \`address\` VARCHAR(255) NOT NULL,
        \`is_trusted\` TINYINT(1) NOT NULL DEFAULT 0,
        \`verified_booking_count\` INT NOT NULL DEFAULT 0,
        \`verify_status\` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_landlord_profiles_user\` (\`user_id\`),
        CONSTRAINT \`fk_landlord_profiles_user\` FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`landlord_profiles\`;`);
    await queryRunner.query(`DROP TABLE \`student_profiles\`;`);
  }
}
