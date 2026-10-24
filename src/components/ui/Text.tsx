import React from 'react';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'body' | 'secondary' | 'meta' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'white';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'secondary',
  weight = 'normal',
  children,
  className = '',
  as: Component = 'p',
  ...props
}) => {
  const variantStyles = {
    body: 'text-[14px] leading-[21px]',
    secondary: 'text-[12px] leading-[18px]',
    meta: 'text-[11px] leading-[16px]',
    caption: 'text-[10px] leading-[15px]',
  }[variant];

  const colorStyles = {
    primary: 'text-[var(--ink-primary)]',
    secondary: 'text-[var(--ink-secondary)]',
    muted: 'text-[var(--ink-muted)]',
    accent: 'text-[var(--accent-ochre)]',
    white: 'text-white',
  }[color];

  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[weight];

  return (
    <Component
      className={`font-sans ${variantStyles} ${colorStyles} ${weightStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
