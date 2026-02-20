import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface NeoCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export default function NeoCard({ 
  children, 
  className = '', 
  glow = false,
  hover = true,
  onClick 
}: NeoCardProps) {
  const baseClasses = 'bg-neo-dark border border-neo-blue/30 rounded-lg';
  const glowClasses = glow ? 'shadow-aura' : '';
  const hoverClasses = hover ? 'hover:shadow-aura hover:border-neo-blue/50 transition-all duration-300' : '';
  const clickClasses = onClick ? 'cursor-pointer' : '';

  return (
    <motion.div
      className={`${baseClasses} ${glowClasses} ${hoverClasses} ${clickClasses} ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { scale: 1.02 } : {}}
    >
      {children}
    </motion.div>
  );
}
