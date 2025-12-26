import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { MapPin, Check, Loader2, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitySuggestion {
  name: string;
  fullName: string;
  region?: string;
  country?: string;
  coordinates: { lat: number; lon: number };
  kind: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, verified?: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  label = 'Город проживания',
  placeholder = 'Начните вводить название города',
  required = false,
  error,
  hint,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (showDropdown) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [showDropdown, updateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocoding
  const geocodeCity = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsVerified(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: fnError } = await api.geocode.city(query);

      if (fnError) {
        console.error('Geocode error:', fnError);
        setSuggestions([]);
        return;
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowDropdown(true);
        updateDropdownPosition();
        
        // Check for exact match
        if (data.exactMatch) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } else {
        setSuggestions([]);
        setIsVerified(false);
      }
    } catch (err) {
      console.error('Geocode error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [updateDropdownPosition]);

  // Debounce effect
  useEffect(() => {
    // Skip geocoding if we just selected a city
    if (justSelected) {
      return;
    }
    
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        setIsVerified(false);
      }
      if (inputValue && inputValue.length >= 2) {
        geocodeCity(inputValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, geocodeCity, value, justSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsVerified(false);
    setJustSelected(false); // Reset flag when user types
    onChange(newValue, false);
  };

  const handleSelectSuggestion = (suggestion: CitySuggestion) => {
    // Format city: только "г. Название"
    const formattedCity = `г. ${suggestion.name}`;
    setInputValue(formattedCity);
    setIsVerified(true);
    setShowDropdown(false);
    setSuggestions([]);
    setJustSelected(true); // Prevent dropdown from reopening
    onChange(formattedCity, true);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      updateDropdownPosition();
      setShowDropdown(true);
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
    isVerified && 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
  );

  // Render dropdown via portal
  const dropdownPortal = showDropdown && suggestions.length > 0 && createPortal(
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
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.name}-${index}`}
          type="button"
          onClick={() => handleSelectSuggestion(suggestion)}
          className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors flex items-start gap-3 border-b border-white/5 last:border-b-0 bg-card"
        >
          <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-foreground">{suggestion.name}</div>
            {suggestion.region && (
              <div className="text-sm text-muted-foreground">
                {suggestion.region}{suggestion.country && `, ${suggestion.country}`}
              </div>
            )}
          </div>
        </button>
      ))}
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
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <MapPin className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={inputClasses}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : isVerified ? (
            <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in-50 duration-200" />
          ) : null}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <X className="w-4 h-4 flex-shrink-0" /> {error}
        </p>
      )}

      {isVerified && !error && (
        <p className="text-xs text-emerald-600 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          Город подтверждён
        </p>
      )}

      {hint && !error && !isVerified && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" /> {hint}
        </p>
      )}

      {dropdownPortal}
    </div>
  );
}