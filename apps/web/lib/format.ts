/** Định dạng tiền VND. */
export function formatVnd(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export const ACCOMMODATION_TYPE_LABEL: Record<string, string> = {
  TRADITIONAL: 'Phòng trọ',
  MINI_APT: 'Căn hộ mini',
  SHARED: 'Ở ghép',
};
