import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { X, Info, CheckCircle } from 'lucide-react';

interface BaseInputProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  success?: boolean;
}

type InputProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseInputProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

type FormInputProps = InputProps | TextareaProps;

const isTextarea = (props: FormInputProps): props is TextareaProps => {
  return 'multiline' in props && props.multiline === true;
};

export const FormInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormInputProps>(
  (props, ref) => {
    const { label, error, required, hint, success, className, ...rest } = props;

    const baseClasses = cn(
      'w-full px-4 py-3 rounded-xl',
      'bg-card/50 backdrop-blur-sm',
      'border border-white/10',
      'text-foreground placeholder:text-muted-foreground',
      'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
      'transition-all duration-200',
      error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
      success && 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20',
      className
    );

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        
        <div className="relative">
          {isTextarea(props) ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              className={cn(baseClasses, 'min-h-[120px] resize-none')}
              {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              className={cn(baseClasses, success && 'pr-10')}
              {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          
          {success && !isTextarea(props) && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          )}
        </div>
        
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <X className="w-4 h-4 flex-shrink-0" /> {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" /> {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
