import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoommatePosts1700000000008 implements MigrationInterface {
  name = 'CreateRoommatePosts1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`roommate_posts\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`student_id\` BIGINT NOT NULL,
        \`major\` VARCHAR(100) NOT NULL,
        \`budget\` DECIMAL(12,2) NULL,
        \`preferred_area_id\` INT NULL,
        \`description\` TEXT NULL,
        \`status\` ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_roommate_posts_student\` FOREIGN KEY (\`student_id\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_roommate_posts_area\` FOREIGN KEY (\`preferred_area_id\`)
          REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`roommate_posts\`;`);
  }
}
