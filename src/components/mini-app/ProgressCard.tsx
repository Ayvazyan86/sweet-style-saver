import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  filledCount: number;
  totalCount: number;
  delay?: number;
}

export const ProgressCard = ({ 
  children, 
  className, 
  title,
  filledCount, 
  totalCount,
  delay = 0
}: ProgressCardProps) => {
  const percentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
  const isComplete = percentage === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        'relative rounded-2xl p-6',
        'bg-gradient-to-br from-card/80 to-card/40',
        'backdrop-blur-xl border border-white/10',
        'shadow-card',
        className
      )}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30">
        <motion.div 
          className={cn(
            "h-full transition-all duration-500",
            isComplete ? "bg-success" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
        />
      </div>

      {/* Header with progress */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-success"
              >
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">Готово</span>
              </motion.div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {filledCount}/{totalCount}
              </span>
            )}
          </div>
        </div>
      )}

      {children}
    </motion.div>
  );
};
