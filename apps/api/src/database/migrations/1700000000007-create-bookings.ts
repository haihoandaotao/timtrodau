import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookings1700000000007 implements MigrationInterface {
  name = 'CreateBookings1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`bookings\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`student_id\` BIGINT NOT NULL,
        \`accommodation_id\` BIGINT NOT NULL,
        \`status\` ENUM('PENDING','CONTACTED','SUCCESS','CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`note\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_bookings_student\` FOREIGN KEY (\`student_id\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_bookings_accommodation\` FOREIGN KEY (\`accommodation_id\`)
          REFERENCES \`accommodations\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`bookings\`;`);
  }
}
