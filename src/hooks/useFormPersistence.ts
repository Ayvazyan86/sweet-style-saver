import { useState, useEffect, useCallback } from 'react';

interface FormPersistenceOptions {
  key: string;
  expirationDays?: number;
}

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export function useFormPersistence<T>(
  initialData: T,
  options: FormPersistenceOptions
) {
  const { key, expirationDays = 7 } = options;
  const storageKey = `form_draft_${key}`;

  const [formData, setFormData] = useState<T>(() => {
    if (typeof window === 'undefined') return initialData;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredData<T> = JSON.parse(stored);
        
        if (Date.now() > parsed.expiresAt) {
          localStorage.removeItem(storageKey);
          return initialData;
        }
        
        return { ...initialData, ...parsed.data };
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
    
    return initialData;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const saveData = () => {
      try {
        const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
        const storedData: StoredData<T> = {
          data: formData,
          timestamp: Date.now(),
          expiresAt: Date.now() + expirationMs,
        };
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    };

    const debounceTimer = setTimeout(saveData, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData, storageKey, expirationDays]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setFormData(initialData);
      setLastSaved(null);
    } catch (error) {
      console.error('Error clearing form data from localStorage:', error);
    }
  }, [storageKey, initialData]);

  return {
    formData,
    setFormData,
    updateField,
    clearSavedData,
    lastSaved,
  };
}
