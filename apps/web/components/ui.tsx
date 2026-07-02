import Link from 'next/link';
import type { ReactNode } from 'react';

/** Bộ component UI dùng chung — theme đỏ DAU. */

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-card ${
        hover ? 'transition hover:-translate-y-0.5 hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'danger' | 'warning';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
};

const buttonClasses = (variant: string) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60';
  const variants: Record<string, string> = {
    primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
    outline: 'border border-brand text-brand hover:bg-brand-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return `${base} ${variants[variant]}`;
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${buttonClasses(variant)} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: ButtonProps & { href: string }) {
  return (
    <Link href={href} className={`${buttonClasses(variant)} ${className}`}>
      {children}
    </Link>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-card ${
        accent ? 'border-transparent bg-brand-gradient text-white' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className={`text-xs font-medium ${accent ? 'text-white/80' : 'text-slate-400'}`}>
          {label}
        </span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-white' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function BarRow({
  label,
  value,
  max,
  wide,
}: {
  label: string;
  value: number;
  max: number;
  /** Cột nhãn rộng hơn + xuống dòng (cho tên dài như tên ngành). */
  wide?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span
        className={`shrink-0 text-slate-600 ${
          wide ? 'w-52 whitespace-normal break-words leading-tight' : 'w-28 truncate'
        }`}
      >
        {label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-gradient"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="w-8 text-right font-semibold text-slate-700">{value}</span>
    </div>
  );
}
