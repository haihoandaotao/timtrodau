import { MigrationInterface, QueryRunner } from 'typeorm';

/** Thêm candidate_code (mã thí sinh từ hệ thống tuyển sinh) để đồng bộ idempotent. */
export class AdmissionCandidateCode1700000000016 implements MigrationInterface {
  name = 'AdmissionCandidateCode1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`admission_candidates\`
        ADD COLUMN \`candidate_code\` VARCHAR(64) NULL,
        ADD UNIQUE INDEX \`uq_admission_candidate_code\` (\`candidate_code\`);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`admission_candidates\` DROP INDEX \`uq_admission_candidate_code\`, DROP COLUMN \`candidate_code\`;`,
    );
  }
}
