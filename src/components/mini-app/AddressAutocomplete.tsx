import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, Check, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, verified?: boolean) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

interface AddressSuggestion {
  address: string;
  fullAddress: string;
  details?: string;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  label,
  placeholder = 'ул. Примерная, д. 1',
  hint,
  error,
  required = false
}: AddressAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [justSelected, setJustSelected] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address search via Yandex Geocoder
  useEffect(() => {
    if (justSelected) {
      return;
    }

    const timer = setTimeout(async () => {
      if (inputValue.length >= 5 && inputValue !== value) {
        setIsLoading(true);
        try {
          const { data, error: fnError } = await supabase.functions.invoke('geocode-address', {
            body: { address: inputValue }
          });

          if (!fnError && data?.suggestions) {
            const addressSuggestions: AddressSuggestion[] = data.suggestions.map((s: any) => ({
              address: s.name,
              fullAddress: s.fullName,
              details: s.region
            }));
            setSuggestions(addressSuggestions);
            if (addressSuggestions.length > 0) {
              updateDropdownPosition();
              setIsOpen(true);
            }
            setIsValidated(null);
          } else {
            setSuggestions([]);
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
  }, [inputValue, value, justSelected, updateDropdownPosition]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.fullAddress);
    onChange(suggestion.fullAddress, true);
    setIsOpen(false);
    setSuggestions([]);
    setIsValidated(true);
    setJustSelected(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValidated(null);
    setJustSelected(false);
    if (newValue !== value) {
      onChange(newValue, false);
    }
  };

  const handleBlur = () => {
    // Small delay so click on suggestion works
    setTimeout(() => {
      // Accept manual input if long enough
      if (inputValue.length >= 10 && isValidated === null) {
        setIsValidated(true);
        onChange(inputValue, true);
      }
      setIsOpen(false);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      updateDropdownPosition();
      setIsOpen(true);
    }
  };

  // Unified input styles matching FormInput
  const inputClasses = cn(
    'w-full pl-10 pr-10 py-3 rounded-xl',
    'bg-card/50 backdrop-blur-sm',
    'border border-white/10',
    'text-foreground placeholder:text-muted-foreground',
    'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
    'transition-all duration-200',
    error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
    isValidated === true && 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
  );

  // Portal dropdown
  const dropdownPortal = isOpen && suggestions.length > 0 && createPortal(
    <div 
      ref={dropdownRef}
      className="fixed bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
    >
      <div className="max-h-48 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(suggestion)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-white/5 last:border-b-0 bg-card"
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
    </div>,
    document.body
  );

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground block">
          {label} {required && <span className="text-destructive">*</span>}
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClasses}
        />

        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidated === true && (
            <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in-50 duration-200" />
          )}
        </div>
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

      {dropdownPortal}
    </div>
  );
};