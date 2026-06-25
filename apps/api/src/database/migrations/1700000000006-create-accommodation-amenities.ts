import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccommodationAmenities1700000000006 implements MigrationInterface {
  name = 'CreateAccommodationAmenities1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`accommodation_amenities\` (
        \`accommodation_id\` BIGINT NOT NULL,
        \`amenity_id\` INT NOT NULL,
        PRIMARY KEY (\`accommodation_id\`, \`amenity_id\`),
        INDEX \`idx_acc_amenities_amenity\` (\`amenity_id\`),
        CONSTRAINT \`fk_acc_amenities_accommodation\` FOREIGN KEY (\`accommodation_id\`)
          REFERENCES \`accommodations\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_acc_amenities_amenity\` FOREIGN KEY (\`amenity_id\`)
          REFERENCES \`amenities\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`accommodation_amenities\`;`);
  }
}
