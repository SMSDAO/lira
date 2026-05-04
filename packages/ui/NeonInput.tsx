import { InputHTMLAttributes, forwardRef } from 'react';

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(
  ({ label, error, wrapperClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label className="text-sm font-medium text-white/70">{label}</label>
        )}
        <input
          ref={ref}
          className={[
            'w-full rounded-xl px-4 py-3',
            'bg-white/[0.05] backdrop-blur-[20px]',
            'border border-white/[0.08]',
            'text-white placeholder-white/30',
            'shadow-[0_10px_30px_rgba(0,0,0,0.4)]',
            'focus:outline-none focus:border-[#7C3AED]/60 focus:shadow-[0_0_20px_rgba(124,58,237,0.5)]',
            'transition-all duration-300',
            error ? 'border-red-500/60' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

NeonInput.displayName = 'NeonInput';

export default NeonInput;
