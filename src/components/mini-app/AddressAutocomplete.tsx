import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, verified?: boolean) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}

interface AddressSuggestion {
  address: string;
  details: string;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  label,
  placeholder = 'Город, улица, дом',
  hint,
  error
}: AddressAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced поиск адресов
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 5 && inputValue !== value) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('geocode-city', {
            body: { query: inputValue }
          });

          if (!error && data?.suggestions) {
            const addressSuggestions: AddressSuggestion[] = data.suggestions.map((s: any) => ({
              address: s.name,
              details: s.description || ''
            }));
            setSuggestions(addressSuggestions);
            setIsOpen(addressSuggestions.length > 0);
            setIsValidated(null);
          }
        } catch (err) {
          console.error('Error fetching address suggestions:', err);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else if (inputValue.length < 5) {
        setSuggestions([]);
        setIsOpen(false);
        setIsValidated(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    const fullAddress = suggestion.details 
      ? `${suggestion.address}, ${suggestion.details}`
      : suggestion.address;
    setInputValue(fullAddress);
    onChange(fullAddress, true);
    setIsOpen(false);
    setSuggestions([]);
    setIsValidated(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValidated(null);
    if (newValue !== value) {
      onChange(newValue, false);
    }
  };

  const handleBlur = () => {
    // Небольшая задержка чтобы клик по suggestion успел сработать
    setTimeout(() => {
      if (!suggestions.some(s => s.address === inputValue || `${s.address}, ${s.details}` === inputValue)) {
        if (inputValue.length >= 10) {
          setIsValidated(true); // Принимаем ручной ввод если достаточно длинный
        }
      }
      setIsOpen(false);
    }, 200);
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-foreground block">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-xl bg-card/60 backdrop-blur-sm',
            'border transition-all duration-200 text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            error ? 'border-destructive' : 'border-white/10 hover:border-primary/40',
            isValidated === true && 'border-emerald-500/50'
          )}
        />

        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidated === true && (
            <Check className="w-4 h-4 text-emerald-500" />
          )}
          {error && (
            <X className="w-4 h-4 text-destructive" />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {suggestion.address}
                    </p>
                    {suggestion.details && (
                      <p className="text-xs text-muted-foreground truncate">
                        {suggestion.details}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hint or error */}
      {(hint || error) && (
        <p className={cn(
          'text-xs',
          error ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {error || hint}
        </p>
      )}
    </div>
  );
};