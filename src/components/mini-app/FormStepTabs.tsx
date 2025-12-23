import { cn } from '@/lib/utils';
import { Check, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FormStep {
  id: number;
  title: string;
  shortTitle?: string;
  icon: LucideIcon;
}

interface FormStepTabsProps {
  steps: FormStep[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepId: number) => void;
  allowNavigation?: boolean;
  progressiveReveal?: boolean; // Show tabs in pairs as user progresses
}

export function FormStepTabs({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  allowNavigation = true,
  progressiveReveal = false,
}: FormStepTabsProps) {
  const handleClick = (stepId: number) => {
    if (!allowNavigation) return;
    // Can only navigate to completed steps or current step
    if (completedSteps.includes(stepId) || stepId === currentStep || stepId === currentStep + 1) {
      onStepClick?.(stepId);
    }
  };

  // Calculate which pair of steps to show based on current step
  // Steps 1-2: show steps 1-2
  // Steps 3-4: show steps 3-4
  // Steps 5-6: show steps 5-6
  // Steps 7-8: show steps 7-8
  const getVisibleSteps = () => {
    if (!progressiveReveal) return steps;
    const pairIndex = Math.ceil(currentStep / 2);
    const startIndex = (pairIndex - 1) * 2;
    const endIndex = Math.min(startIndex + 2, steps.length);
    return steps.slice(startIndex, endIndex);
  };

  const visibleSteps = getVisibleSteps();

  return (
    <div className="w-full">
      {/* Desktop/Tablet view - horizontal tabs */}
      <div className={cn(
        "flex gap-2 pb-2",
        progressiveReveal && "w-full"
      )}>
        {visibleSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isAccessible = isCompleted || isCurrent || step.id === currentStep + 1;
          const isLast = index === visibleSteps.length - 1;

          return (
            <motion.button
              key={step.id}
              type="button"
              onClick={() => handleClick(step.id)}
              disabled={!allowNavigation || !isAccessible}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 rounded-xl',
                'border transition-all duration-300',
                progressiveReveal ? 'flex-1 min-w-0 justify-center' : 'flex-shrink-0 min-w-[120px]',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                isCurrent && [
                  'bg-gradient-to-br from-primary/20 to-primary/5',
                  'border-primary/50 shadow-lg shadow-primary/10',
                ],
                isCompleted && !isCurrent && [
                  'bg-card/80 border-success/30',
                  'hover:border-success/50 hover:bg-card',
                ],
                !isCurrent && !isCompleted && isAccessible && [
                  'bg-card/50 border-border/50',
                  'hover:border-primary/30 hover:bg-card/70',
                ],
                !isAccessible && [
                  'bg-card/30 border-border/20 opacity-50 cursor-not-allowed',
                ],
                allowNavigation && isAccessible && 'cursor-pointer',
              )}
            >
              {/* Icon container */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  'transition-all duration-300',
                  isCurrent && 'bg-primary text-primary-foreground shadow-glow-primary',
                  isCompleted && !isCurrent && 'bg-success/20 text-success',
                  !isCurrent && !isCompleted && 'bg-muted/50 text-muted-foreground',
                )}
              >
                {isCompleted && !isCurrent ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Text */}
              <div className="flex flex-col items-start min-w-0">
                <span
                  className={cn(
                    'text-xs font-medium truncate',
                    isCurrent && 'text-primary',
                    isCompleted && !isCurrent && 'text-success',
                    !isCurrent && !isCompleted && 'text-muted-foreground',
                  )}
                >
                  {step.shortTitle || step.title}
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                  Шаг {step.id}
                </span>
              </div>

              {/* Active indicator line */}
              {isCurrent && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Connector line to next tab */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-0.5 z-10',
                    isCompleted ? 'bg-success/50' : 'bg-border/30',
                  )}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Progress bar underneath */}
      <div className="mt-3 h-1 bg-card rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary to-accent"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
