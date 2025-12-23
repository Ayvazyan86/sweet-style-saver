import { useState, useEffect, forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle } from 'lucide-react';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string;
  value: string; // ISO date format YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, value, onChange, error, required, className, ...rest }, ref) => {
    // Display value in DD.MM.YYYY format
    const [displayValue, setDisplayValue] = useState('');

    // Convert ISO date to display format
    useEffect(() => {
      if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          setDisplayValue(
            `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
          );
        }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Remove all non-digits
      let digits = input.replace(/\D/g, '');
      
      // Limit to 8 digits (DDMMYYYY)
      if (digits.length > 8) {
        digits = digits.slice(0, 8);
      }
      
      // Format with dots
      let formatted = '';
      if (digits.length > 0) {
        formatted = digits.slice(0, 2);
      }
      if (digits.length > 2) {
        formatted += '.' + digits.slice(2, 4);
      }
      if (digits.length > 4) {
        formatted += '.' + digits.slice(4, 8);
      }
      
      setDisplayValue(formatted);
      
      // If we have a complete date, validate and update
      if (digits.length === 8) {
        const day = parseInt(digits.slice(0, 2));
        const month = parseInt(digits.slice(2, 4));
        const year = parseInt(digits.slice(4, 8));
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
          const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          onChange(isoDate);
        }
      } else {
        // Clear the ISO value if incomplete
        if (value) {
          onChange('');
        }
      }
    };

    const success = value && !error;

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder="ДД.ММ.ГГГГ"
            inputMode="numeric"
            maxLength={10}
            className={cn(
              'w-full px-4 py-3 rounded-xl',
              'bg-card/50 backdrop-blur-sm',
              'border border-white/10',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200',
              error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
              success && 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10',
              className
            )}
            {...rest}
          />
          {success && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-in zoom-in-50 duration-200" />
          )}
        </div>
        
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <X className="w-4 h-4 flex-shrink-0" /> {error}
          </p>
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';