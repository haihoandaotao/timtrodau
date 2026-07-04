import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bảng landlord_reviews — SV đánh giá chủ trọ sau khi giữ chỗ thành công.
 * Ràng buộc unique (student_id, landlord_id): mỗi SV đánh giá 1 chủ trọ 1 lần.
 */
export class CreateLandlordReviews1700000000022 implements MigrationInterface {
  name = 'CreateLandlordReviews1700000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`landlord_reviews\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`landlord_id\` BIGINT NOT NULL,
        \`student_id\` BIGINT NOT NULL,
        \`booking_id\` BIGINT NOT NULL,
        \`rating\` SMALLINT NOT NULL,
        \`comment\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_landlord_reviews_landlord\` (\`landlord_id\`),
        UNIQUE KEY \`uq_landlord_review_student_landlord\` (\`student_id\`, \`landlord_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`landlord_reviews\`;`);
  }
}
