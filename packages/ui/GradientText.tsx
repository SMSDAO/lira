import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  /** Direction of the gradient: default is left-to-right (purple→blue) */
  direction?: 'lr' | 'diagonal';
}

export default function GradientText({
  children,
  className = '',
  direction = 'lr',
}: GradientTextProps) {
  const gradientClass =
    direction === 'diagonal'
      ? 'bg-gradient-to-br from-[#7C3AED] to-[#2563EB]'
      : 'bg-gradient-to-r from-[#7C3AED] to-[#2563EB]';

  return (
    <span
      className={`${gradientClass} bg-clip-text text-transparent inline-block ${className}`}
    >
      {children}
    </span>
  );
}
