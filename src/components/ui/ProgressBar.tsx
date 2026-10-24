import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'bg-[var(--accent-ochre)]',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full h-[5px] bg-[#EBEDEF] dark:bg-white/10 rounded-[3px] overflow-hidden ${className}`}
    >
      <div
        className={`h-full ${color} rounded-[3px] transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
