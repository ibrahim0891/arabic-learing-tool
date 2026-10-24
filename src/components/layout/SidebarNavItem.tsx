import React from 'react';
import Link from 'next/link';

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  href,
  icon,
  label,
  isActive,
  badge,
  onClick,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center justify-between px-3 h-[44px] rounded-[8px] transition-colors no-underline select-none ${
        isActive
          ? 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] font-semibold'
          : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] font-medium'
      }`}
    >
      <div className="flex items-center gap-[11px] min-w-0">
        <span
          className={`w-[18px] h-[18px] flex items-center justify-center shrink-0 ${
            isActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-secondary)] group-hover:text-[var(--ink-primary)]'
          }`}
        >
          {icon}
        </span>
        <span className="text-[12px] leading-[18px] truncate">{label}</span>
      </div>

      {badge !== undefined && badge !== null && (
        <span
          className={`text-[11px] leading-[16px] px-1.5 py-0.5 rounded-full ${
            isActive
              ? 'text-[var(--accent-ochre)] bg-[var(--accent-ochre)]/10 font-medium'
              : 'text-[var(--ink-muted)] font-normal'
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};
