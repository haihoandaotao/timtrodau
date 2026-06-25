import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccommodations1700000000004 implements MigrationInterface {
  name = 'CreateAccommodations1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`accommodations\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`landlord_id\` BIGINT NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`description\` TEXT NULL,
        \`price\` DECIMAL(12,2) NOT NULL,
        \`type\` ENUM('TRADITIONAL','MINI_APT','SHARED') NOT NULL,
        \`address\` VARCHAR(255) NOT NULL,
        \`area_id\` INT NULL,
        \`lat\` DECIMAL(10,7) NULL,
        \`lng\` DECIMAL(10,7) NULL,
        \`distance_km\` DECIMAL(5,2) NULL,
        \`extra_costs\` JSON NULL,
        \`is_available\` TINYINT(1) NOT NULL DEFAULT 1,
        \`status\` ENUM('DRAFT','PENDING','PUBLISHED','REJECTED','HIDDEN') NOT NULL DEFAULT 'PENDING',
        \`reject_reason\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_accommodations_landlord\` FOREIGN KEY (\`landlord_id\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_accommodations_area\` FOREIGN KEY (\`area_id\`)
          REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`accommodations\`;`);
  }
}
