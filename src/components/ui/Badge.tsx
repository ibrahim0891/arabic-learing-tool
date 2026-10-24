import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'ochre' | 'neutral' | 'success' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'ochre',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    ochre: 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)]',
    neutral: 'bg-[var(--border-subtle)] text-[var(--ink-secondary)]',
    success: 'bg-[var(--accent-cypress-dim)] text-[var(--accent-cypress)]',
    danger: 'bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)]',
  }[variant];

  const hasCustomDisplay = /\b(hidden|flex|inline-flex|block|inline-block|grid)\b/.test(className);
  const displayClass = hasCustomDisplay ? '' : 'inline-flex';

  return (
    <span
      className={`${displayClass} items-center px-[9px] py-[3px] rounded-[6px] text-[11px] leading-[17px] font-semibold tracking-wide font-sans shrink-0 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
