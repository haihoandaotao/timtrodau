import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImages1700000000005 implements MigrationInterface {
  name = 'CreateImages1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`images\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`accommodation_id\` BIGINT NOT NULL,
        \`url\` VARCHAR(255) NOT NULL,
        \`media_type\` ENUM('IMAGE','VIDEO') NOT NULL DEFAULT 'IMAGE',
        \`sort_order\` SMALLINT NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_images_accommodation_id\` (\`accommodation_id\`),
        CONSTRAINT \`fk_images_accommodation\` FOREIGN KEY (\`accommodation_id\`)
          REFERENCES \`accommodations\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`images\`;`);
  }
}
