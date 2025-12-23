import { cn } from '@/lib/utils';
import { ReactNode, forwardRef } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, onClick, hoverable = false }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'relative rounded-2xl p-6',
          'bg-gradient-to-br from-card/80 to-card/40',
          'backdrop-blur-xl border border-white/10',
          'shadow-card',
          hoverable && 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-glow-primary',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
