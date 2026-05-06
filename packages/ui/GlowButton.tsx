import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type GlowButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: 'gradient' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
  };

export default function GlowButton({
  children,
  variant = 'gradient',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: GlowButtonProps) {
  const variantClasses = {
    gradient:
      'bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]',
    outline:
      'bg-transparent border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]',
    ghost:
      'bg-transparent text-white/70 hover:text-white hover:bg-white/[0.05]',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={[
        variantClasses[variant],
        sizeClasses[size],
        'transition-all duration-300',
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      whileHover={{ scale: isDisabled ? 1 : 1.04 }}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading…
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
