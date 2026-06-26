import { MigrationInterface, QueryRunner } from 'typeorm';

/** Thêm map_url (link Google Maps) + views (số lượt tiếp cận) cho accommodations. */
export class AccommodationViewsMap1700000000014 implements MigrationInterface {
  name = 'AccommodationViewsMap1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`accommodations\`
        ADD COLUMN \`map_url\` VARCHAR(500) NULL,
        ADD COLUMN \`views\` INT NOT NULL DEFAULT 0;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`accommodations\` DROP COLUMN \`views\`, DROP COLUMN \`map_url\`;`,
    );
  }
}
