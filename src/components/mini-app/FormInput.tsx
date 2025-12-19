import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BaseInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

type InputProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseInputProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

type FormInputProps = InputProps | TextareaProps;

const isTextarea = (props: FormInputProps): props is TextareaProps => {
  return 'multiline' in props && props.multiline === true;
};

export const FormInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormInputProps>(
  (props, ref) => {
    const { label, error, required, className, ...rest } = props;

    const baseClasses = cn(
      'w-full px-4 py-3 rounded-xl',
      'bg-card/50 backdrop-blur-sm',
      'border border-white/10',
      'text-foreground placeholder:text-muted-foreground',
      'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
      'transition-all duration-200',
      error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
      className
    );

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        
        {isTextarea(props) ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={cn(baseClasses, 'min-h-[120px] resize-none')}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={baseClasses}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <X className="w-4 h-4" /> {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
