import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'gold';
}

export const SubmitButton = ({ 
  children, 
  loading, 
  variant = 'primary',
  className, 
  disabled,
  ...props 
}: SubmitButtonProps) => {
  const variants = {
    primary: 'bg-gradient-primary hover:opacity-90 shadow-glow-primary',
    secondary: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90',
    gold: 'bg-gradient-gold hover:opacity-90 shadow-glow-gold',
  };

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        'w-full py-4 px-6 rounded-xl',
        'text-white font-semibold text-lg',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        variants[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Отправка...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
