import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  loading?: boolean;
}

export default function NeoButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: NeoButtonProps) {
  const variantClasses = {
    primary: 'bg-neo-blue text-neo-darker font-bold hover:shadow-aura-lg',
    secondary: 'bg-transparent border-2 border-neo-blue text-neo-blue hover:bg-neo-blue/10',
    ghost: 'bg-transparent text-neo-blue hover:bg-neo-darker',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const glowClasses = glow ? 'shadow-aura' : '';
  const disabledClasses = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${glowClasses} ${disabledClasses} rounded-lg transition-all duration-300 ${className}`}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </motion.button>
  );
}
