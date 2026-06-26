import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hỗ trợ chủ trọ đăng ký bằng Gmail rồi hoàn thiện hồ sơ sau:
 * - id_card_no, address → nullable (chưa cần khi đăng ký Gmail).
 * - thêm representative_name + representative_photo_url (người đại diện + ảnh).
 */
export class LandlordGmailProfile1700000000015 implements MigrationInterface {
  name = 'LandlordGmailProfile1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`landlord_profiles\`
        MODIFY \`id_card_no\` VARCHAR(20) NULL,
        MODIFY \`address\` VARCHAR(255) NULL,
        ADD COLUMN \`representative_name\` VARCHAR(191) NULL,
        ADD COLUMN \`representative_photo_url\` VARCHAR(255) NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`landlord_profiles\`
        DROP COLUMN \`representative_photo_url\`,
        DROP COLUMN \`representative_name\`,
        MODIFY \`address\` VARCHAR(255) NOT NULL,
        MODIFY \`id_card_no\` VARCHAR(20) NOT NULL;`,
    );
  }
}
