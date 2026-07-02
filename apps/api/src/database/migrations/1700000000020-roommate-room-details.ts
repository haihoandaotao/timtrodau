import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mở rộng tin tìm bạn ở ghép: SV giới thiệu chỗ trọ đang ở.
 * - Thêm address, contact_phone, gender_pref vào roommate_posts.
 * - Tạo bảng roommate_post_images (ảnh căn hộ/phòng).
 */
export class RoommateRoomDetails1700000000020 implements MigrationInterface {
  name = 'RoommateRoomDetails1700000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`roommate_posts\`
        ADD COLUMN \`address\` VARCHAR(255) NULL,
        ADD COLUMN \`contact_phone\` VARCHAR(20) NULL,
        ADD COLUMN \`gender_pref\` ENUM('ANY', 'MALE', 'FEMALE') NOT NULL DEFAULT 'ANY';`,
    );
    await queryRunner.query(
      `CREATE TABLE \`roommate_post_images\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`post_id\` BIGINT NOT NULL,
        \`url\` VARCHAR(255) NOT NULL,
        \`sort_order\` SMALLINT NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        KEY \`idx_roommate_post_images_post\` (\`post_id\`),
        CONSTRAINT \`fk_roommate_post_images_post\` FOREIGN KEY (\`post_id\`)
          REFERENCES \`roommate_posts\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`roommate_post_images\`;`);
    await queryRunner.query(
      `ALTER TABLE \`roommate_posts\`
        DROP COLUMN \`gender_pref\`,
        DROP COLUMN \`contact_phone\`,
        DROP COLUMN \`address\`;`,
    );
  }
}
