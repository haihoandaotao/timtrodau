import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAreasAmenities1700000000003 implements MigrationInterface {
  name = 'CreateAreasAmenities1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`areas\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL,
        \`center_lat\` DECIMAL(10,7) NULL,
        \`center_lng\` DECIMAL(10,7) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE \`amenities\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`code\` VARCHAR(50) NOT NULL,
        \`label\` VARCHAR(100) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_amenities_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`amenities\`;`);
    await queryRunner.query(`DROP TABLE \`areas\`;`);
  }
}
