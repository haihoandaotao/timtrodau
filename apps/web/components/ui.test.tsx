import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// next/link cần router context — thay bằng thẻ <a> đơn giản khi test.
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { Badge, BarRow, StatCard } from './ui';

describe('Badge', () => {
  it('hiển thị nội dung con', () => {
    render(<Badge tone="brand">Đã duyệt</Badge>);
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('hiển thị nhãn và giá trị', () => {
    render(<StatCard label="Tổng phòng" value={12} />);
    expect(screen.getByText('Tổng phòng')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});

describe('BarRow', () => {
  it('hiển thị nhãn và giá trị', () => {
    render(<BarRow label="Kiến trúc" value={5} max={10} />);
    expect(screen.getByText('Kiến trúc')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
