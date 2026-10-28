import React from 'react';
import { Panel } from './Panel';

interface MetricCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subLabel,
  icon,
  onClick,
  className = '',
}) => {
  return (
    <Panel
      padding="none"
      hoverable={!!onClick}
      onClick={onClick}
      className={`flex flex-col justify-between min-h-[95px] sm:min-h-[115px] p-3 sm:p-5 gap-2 sm:gap-3 min-w-0 w-full overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between text-[11px] sm:text-[12px] leading-tight text-[var(--ink-secondary)] gap-1.5 min-w-0">
        <span className="font-normal truncate">{label}</span>
        {icon && <span className="text-[var(--ink-secondary)] opacity-80 shrink-0">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 sm:gap-3 flex-wrap min-w-0">
        <span className="text-[22px] sm:text-[30px] leading-tight font-semibold text-[var(--ink-primary)] tracking-tight">
          {value}
        </span>
        {subLabel && (
          <span className="text-[10px] sm:text-[12px] leading-tight text-[var(--ink-secondary)] font-normal truncate max-w-full">
            {subLabel}
          </span>
        )}
      </div>
    </Panel>
  );
};
