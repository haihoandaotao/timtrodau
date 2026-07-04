/**
 * Unit test SettingsService — mock repo (KHÔNG cần MySQL).
 */
import { SettingsService, SETTING_AUTO_APPROVE } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SettingsService(repo as never);
  });

  it('isAutoApprove: giá trị "true" → true', async () => {
    repo.findOne.mockResolvedValue({ key: SETTING_AUTO_APPROVE, value: 'true' });
    expect(await service.isAutoApprove()).toBe(true);
  });

  it('isAutoApprove: chưa cấu hình (null) → false (mặc định duyệt thủ công)', async () => {
    repo.findOne.mockResolvedValue(null);
    expect(await service.isAutoApprove()).toBe(false);
  });

  it('setAutoApprove(true): lưu đúng key/value', async () => {
    await service.setAutoApprove(true);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ key: SETTING_AUTO_APPROVE, value: 'true' }),
    );
  });

  it('getModeration: trả cờ autoApprove', async () => {
    repo.findOne.mockResolvedValue({ value: 'false' });
    expect(await service.getModeration()).toEqual({ autoApprove: false });
  });
});
