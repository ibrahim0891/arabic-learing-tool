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
      padding="md"
      hoverable={!!onClick}
      onClick={onClick}
      className={`flex flex-col justify-between min-h-[115px] gap-3 ${className}`}
    >
      <div className="flex items-center justify-between text-[12px] leading-[18px] text-[var(--ink-secondary)]">
        <span className="font-normal">{label}</span>
        {icon && <span className="text-[var(--ink-secondary)] opacity-80">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-[30px] leading-[45px] font-semibold text-[var(--ink-primary)] tracking-tight">
          {value}
        </span>
        {subLabel && (
          <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)] font-normal">
            {subLabel}
          </span>
        )}
      </div>
    </Panel>
  );
};
