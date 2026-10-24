import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] leading-normal min-w-0 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-[var(--ink-secondary)] shrink-0 hidden sm:inline-block" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] no-underline transition-colors hidden sm:inline whitespace-nowrap truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`whitespace-nowrap truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none ${
                  isLast
                    ? 'font-semibold text-[14px] sm:text-[13px] text-[var(--ink-primary)]'
                    : 'text-[var(--ink-secondary)] hidden sm:inline'
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
