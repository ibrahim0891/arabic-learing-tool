import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';

interface ActivityCardProps {
  href: string;
  stepTag: string;
  title: string;
  description: string;
  actionText: string;
  icon: React.ReactNode;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  href,
  stepTag,
  title,
  description,
  actionText,
  icon,
}) => {
  return (
    <Link href={href} className="no-underline block group">
      <Panel
        padding="md"
        hoverable
        className="flex items-center gap-[18px] min-h-[127px] transition-all"
      >
        {/* Activity Icon Box */}
        <div className="w-[40px] h-[40px] rounded-[8px] bg-[var(--bg-canvas)] flex items-center justify-center shrink-0 text-[var(--ink-secondary)] group-hover:text-[var(--accent-ochre)] transition-colors">
          {icon}
        </div>

        {/* Activity Details */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="text-[10px] leading-[15px] font-semibold tracking-wider text-[var(--accent-ochre)] uppercase">
            {stepTag}
          </span>
          <h3 className="text-[16px] leading-[24px] font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-ochre)] transition-colors truncate">
            {title}
          </h3>
          <p className="text-[12px] leading-[18px] text-[var(--ink-secondary)] line-clamp-1">
            {description}
          </p>
          <span className="text-[12px] leading-[18px] font-medium text-[var(--accent-ochre)] pt-0.5">
            {actionText}
          </span>
        </div>

        {/* Arrow Action */}
        <div className="w-[18px] h-[18px] flex items-center justify-center text-[var(--ink-secondary)] group-hover:text-[var(--accent-ochre)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </Panel>
    </Link>
  );
};
