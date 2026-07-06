import { describe, expect, it } from 'vitest';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from './format';

describe('formatVnd', () => {
  it('định dạng số thành tiền VND', () => {
    // Intl dùng ký tự phân cách riêng của vi-VN nên chỉ kiểm tra phần số + đơn vị.
    const out = formatVnd(2000000);
    expect(out).toMatch(/2\D?000\D?000/);
    expect(out).toContain('₫');
  });

  it('nhận cả chuỗi số', () => {
    expect(formatVnd('1500000')).toMatch(/1\D?500\D?000/);
  });

  it('giá trị không phải số → trả nguyên chuỗi', () => {
    expect(formatVnd('abc')).toBe('abc');
  });
});

describe('ACCOMMODATION_TYPE_LABEL', () => {
  it('ánh xạ đúng nhãn loại phòng', () => {
    expect(ACCOMMODATION_TYPE_LABEL.TRADITIONAL).toBe('Phòng trọ');
    expect(ACCOMMODATION_TYPE_LABEL.MINI_APT).toBe('Căn hộ mini');
    expect(ACCOMMODATION_TYPE_LABEL.SHARED).toBe('Ở ghép');
  });
});
