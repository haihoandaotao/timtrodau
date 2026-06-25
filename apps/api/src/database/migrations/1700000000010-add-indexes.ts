import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Index tra cứu phụ (secondary) phục vụ Smart Filter & query thống kê.
 * (Unique index của phone/student_code/amenity code đã tạo inline ở M1/M3.)
 */
export class AddIndexes1700000000010 implements MigrationInterface {
  name = 'AddIndexes1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`idx_accommodations_status\` ON \`accommodations\` (\`status\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_accommodations_area_id\` ON \`accommodations\` (\`area_id\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_accommodations_price\` ON \`accommodations\` (\`price\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_accommodations_type\` ON \`accommodations\` (\`type\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_bookings_student_id\` ON \`bookings\` (\`student_id\`);`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_bookings_accommodation_id\` ON \`bookings\` (\`accommodation_id\`);`,
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
    await queryRunner.query(`DROP INDEX \`idx_bookings_accommodation_id\` ON \`bookings\`;`);
    await queryRunner.query(`DROP INDEX \`idx_bookings_student_id\` ON \`bookings\`;`);
    await queryRunner.query(`DROP INDEX \`idx_accommodations_type\` ON \`accommodations\`;`);
    await queryRunner.query(`DROP INDEX \`idx_accommodations_price\` ON \`accommodations\`;`);
    await queryRunner.query(`DROP INDEX \`idx_accommodations_area_id\` ON \`accommodations\`;`);
    await queryRunner.query(`DROP INDEX \`idx_accommodations_status\` ON \`accommodations\`;`);
  }
}
