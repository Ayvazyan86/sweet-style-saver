import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Check, Loader2, AlertCircle } from 'lucide-react';
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
}

export function CityAutocomplete({
  value,
  onChange,
  label = 'Город проживания',
  placeholder = 'Введите название города',
  required = false,
  error,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const { data, error: fnError } = await supabase.functions.invoke('geocode-city', {
        body: { city: query }
      });

      if (fnError) {
        console.error('Geocode error:', fnError);
        setSuggestions([]);
        return;
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowDropdown(true);
        
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
  }, []);

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
    setInputValue(suggestion.name);
    setIsVerified(true);
    setShowDropdown(false);
    setSuggestions([]);
    setJustSelected(true); // Prevent dropdown from reopening
    onChange(suggestion.name, true);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative">
      {label && (
        <Label className="text-sm font-medium text-foreground mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <MapPin className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            error && 'border-destructive focus:ring-destructive',
            isVerified && 'border-green-500/50 focus:ring-green-500'
          )}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : isVerified ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : null}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {isVerified && !error && (
        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Город подтверждён
        </p>
      )}

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${index}`}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3 border-b border-border/50 last:border-b-0"
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
        </div>
      )}
    </div>
  );
}