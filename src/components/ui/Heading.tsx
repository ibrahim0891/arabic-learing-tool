import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-sans font-semibold tracking-tight text-[var(--ink-primary)]';

  switch (level) {
    case 1:
      // Figma: 28px font, line-height 150% (42px)
      return (
        <h1 className={`text-[28px] leading-[42px] font-normal ${baseStyles} ${className}`} {...props}>
          {children}
        </h1>
      );
    case 2:
      // Figma: 23px font, line-height 150% (34px)
      return (
        <h2 className={`text-[23px] leading-[34px] ${baseStyles} ${className}`} {...props}>
          {children}
        </h2>
      );
    case 3:
      // Figma: 16px font, line-height 150% (24px)
      return (
        <h3 className={`text-[16px] leading-[24px] ${baseStyles} ${className}`} {...props}>
          {children}
        </h3>
      );
    case 4:
      // Figma: 14px font, line-height 150% (21px)
      return (
        <h4 className={`text-[14px] leading-[21px] ${baseStyles} ${className}`} {...props}>
          {children}
        </h4>
      );
    default:
      return (
        <h1 className={`text-[28px] leading-[42px] ${baseStyles} ${className}`} {...props}>
          {children}
        </h1>
      );
  }
};
