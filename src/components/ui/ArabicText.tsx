import React from 'react';

interface ArabicTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  color?: 'accent' | 'primary' | 'secondary';
  align?: 'right' | 'center' | 'left';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h2' | 'h3';
}

export const ArabicText: React.FC<ArabicTextProps> = ({
  size = 'md',
  color = 'accent',
  align = 'right',
  weight = 'normal',
  children,
  className = '',
  as: Component = 'span',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[19px] leading-[31px]',
    md: 'text-[21px] leading-[35px]',
    lg: 'text-[24px] leading-[40px]',
    xl: 'text-[27px] leading-[45px]',
    '2xl': 'text-[29px] leading-[48px]',
    hero: 'text-[32px] sm:text-[36px] leading-[54px]',
  }[size];

  const colorStyles = {
    accent: 'text-[var(--accent-ochre)]',
    primary: 'text-[var(--ink-primary)]',
    secondary: 'text-[var(--ink-secondary)]',
  }[color];

  const alignStyles = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[align];

  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[weight];

  return (
    <Component
      dir="rtl"
      className={`font-arabic ${sizeStyles} ${colorStyles} ${alignStyles} ${weightStyles} select-text ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
