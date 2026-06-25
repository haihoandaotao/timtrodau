import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavorites1700000000013 implements MigrationInterface {
  name = 'CreateFavorites1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`favorites\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NOT NULL,
        \`accommodation_id\` BIGINT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`uq_favorite_user_acc\` (\`user_id\`, \`accommodation_id\`),
        INDEX \`idx_favorites_user\` (\`user_id\`),
        CONSTRAINT \`fk_favorites_user\` FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_favorites_accommodation\` FOREIGN KEY (\`accommodation_id\`)
          REFERENCES \`accommodations\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`favorites\`;`);
  }
}
