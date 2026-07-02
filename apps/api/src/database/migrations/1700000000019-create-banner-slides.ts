import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bảng banner_slides — nội dung carousel trang chủ, Admin chỉnh từ UI.
 * Seed sẵn 3 slide mặc định (giữ nguyên nội dung đang hard-code trước đây).
 */
export class CreateBannerSlides1700000000019 implements MigrationInterface {
  name = 'CreateBannerSlides1700000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`banner_slides\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`header_label\` VARCHAR(191) NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`subtitle\` VARCHAR(255) NULL,
        \`image_url\` VARCHAR(255) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    );

    const label = 'Đại học Kiến trúc Đà Nẵng';
    await queryRunner.query(
      `INSERT INTO \`banner_slides\`
        (\`header_label\`, \`title\`, \`subtitle\`, \`sort_order\`, \`is_active\`)
       VALUES (?, ?, ?, ?, 1), (?, ?, ?, ?, 1), (?, ?, ?, ?, 1);`,
      [
        label,
        'Tìm phòng trọ an toàn, gần trường DAU',
        'Nguồn trọ đã kiểm duyệt · giá minh bạch · kết nối trực tiếp chủ trọ.',
        1,
        label,
        'Tân sinh viên 2026 — đăng ký ngay hôm nay',
        'Tạo tài khoản để lưu phòng, giữ chỗ và tìm bạn ở ghép cùng ngành.',
        2,
        label,
        'Bạn là chủ trọ?',
        'Đăng tin cho thuê, tiếp cận hàng nghìn tân sinh viên DAU.',
        3,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`banner_slides\`;`);
  }
}
