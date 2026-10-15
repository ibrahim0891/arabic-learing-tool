import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'pill';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isActive?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      isActive = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base layout & interaction
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    // Size mappings
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-xs sm:text-sm',
      lg: 'px-6 py-3.5 text-sm sm:text-base font-semibold',
    };

    // Variant mappings with guaranteed crisp contrast across light & dark themes
    const variantStyles: Record<ButtonVariant, string> = {
      // Primary: Rich warm ochre with crisp pure-white text and subtle elevation
      primary:
        'bg-[#9a5d16] hover:bg-[#834e10] text-white shadow-sm hover:shadow active:shadow-none border border-transparent font-semibold',
      
      // Secondary: Solid elevated surface with subtle border
      secondary:
        'bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] text-[var(--ink-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
      
      // Outline: Transparent with border and subtle hover fill
      outline:
        'bg-transparent border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)]',
      
      // Danger: Clear red action with white text
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent font-semibold',
      
      // Ghost: Borderless quiet button
      ghost:
        'bg-transparent hover:bg-[var(--accent-ochre-dim)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]',

      // Pill: For filter tags, options & categories
      pill: isActive
        ? 'bg-[#9a5d16] text-white font-semibold shadow-xs border border-transparent'
        : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--border-strong)]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
