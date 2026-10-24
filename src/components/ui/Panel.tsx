import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  padding = 'md',
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-[15px]',
    md: 'p-[20px]',
    lg: 'p-[26px] sm:p-[28px]',
  }[padding];

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[12px] box-border transition-all ${
        hoverable ? 'hover:border-[var(--accent-ochre)] hover:shadow-xs cursor-pointer' : ''
      } ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
