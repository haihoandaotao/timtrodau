import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Index tra cứu phụ (secondary) phục vụ Smart Filter & query thống kê.
 *
 * LƯU Ý: KHÔNG tạo index tường minh trên các cột khóa ngoại (area_id,
 * bookings.student_id, bookings.accommodation_id) — MySQL/MariaDB đã tự
 * tạo index cho mọi FK. Tạo trùng vừa lãng phí vừa khiến down() không thể
 * DROP (index đang backing FK → lỗi ER_DROP_INDEX_FK). Chỉ index cột non-FK.
 * (Unique index của phone/student_code/amenity code đã tạo inline ở M1/M3.)
 */
export class AddIndexes1700000000010 implements MigrationInterface {
  name = 'AddIndexes1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`idx_accommodations_status\` ON \`accommodations\` (\`status\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_accommodations_price\` ON \`accommodations\` (\`price\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_accommodations_type\` ON \`accommodations\` (\`type\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_roommate_posts_major\` ON \`roommate_posts\` (\`major\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_otp_requests_phone\` ON \`otp_requests\` (\`phone\`);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_otp_requests_phone\` ON \`otp_requests\`;`);
    await queryRunner.query(`DROP INDEX \`idx_roommate_posts_major\` ON \`roommate_posts\`;`);
    await queryRunner.query(`DROP INDEX \`idx_accommodations_type\` ON \`accommodations\`;`);
    await queryRunner.query(`DROP INDEX \`idx_accommodations_price\` ON \`accommodations\`;`);
    await queryRunner.query(`DROP INDEX \`idx_accommodations_status\` ON \`accommodations\`;`);
  }
}
