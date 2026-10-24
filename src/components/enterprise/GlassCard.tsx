import type { ReactNode } from 'react';

export type GlassCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}

export default GlassCard;
