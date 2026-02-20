import { ReactNode } from 'react';

interface NeoGlowBackgroundProps {
  children: ReactNode;
  className?: string;
  color?: 'blue' | 'purple' | 'pink';
}

export default function NeoGlowBackground({ 
  children, 
  className = '',
  color = 'blue' 
}: NeoGlowBackgroundProps) {
  const colorClasses = {
    blue: 'from-neo-blue/20 via-neo-dark to-neo-blue/20',
    purple: 'from-neo-purple/20 via-neo-dark to-neo-purple/20',
    pink: 'from-neo-pink/20 via-neo-dark to-neo-pink/20',
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]}`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
