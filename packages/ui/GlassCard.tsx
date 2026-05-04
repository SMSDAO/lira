import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  onClick,
  glow = false,
}: GlassCardProps) {
  return (
    <motion.div
      className={[
        'rounded-2xl border border-white/[0.08]',
        'bg-white/[0.05] backdrop-blur-[20px]',
        'shadow-[0_10px_30px_rgba(0,0,0,0.4)]',
        hover && 'hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:border-white/[0.15] transition-all duration-300',
        glow && 'shadow-[0_0_20px_rgba(124,58,237,0.5)]',
        onClick && 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { scale: 1.01 } : undefined}
    >
      {children}
    </motion.div>
  );
}
