import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
}

interface CategorySelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  error?: string;
}

export const CategorySelect = ({ selectedIds, onChange, multiple = true, error }: CategorySelectProps) => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_en, slug')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    if (multiple) {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter(i => i !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    } else {
      onChange(selectedIds.includes(id) ? [] : [id]);
    }
  };

  const getCategoryName = (cat: Category) => {
    return language === 'en' && cat.name_en ? cat.name_en : cat.name;
  };

  const clearAll = () => onChange([]);
  const selectAll = () => onChange(categories.map(c => c.id));

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-24 bg-card/50 rounded animate-pulse" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-11 w-28 bg-card/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with label and counter */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          {t('categories')} <span className="text-destructive">*</span>
          {selectedIds.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-semibold">
              {selectedIds.length}
            </span>
          )}
        </label>
        
        {/* Quick actions */}
        {multiple && categories.length > 0 && (
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Очистить
              </button>
            )}
            {selectedIds.length < categories.length && (
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Все
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={cn(
                'group relative px-4 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-200 ease-out',
                'border active:scale-95',
                isSelected
                  ? 'bg-gradient-primary text-white border-transparent shadow-glow-primary'
                  : 'bg-card/60 backdrop-blur-sm text-foreground border-white/10 hover:border-primary/40 hover:bg-card/80'
              )}
            >
              <span className="flex items-center gap-2">
                {/* Animated checkmark */}
                <span className={cn(
                  'flex items-center justify-center transition-all duration-200',
                  isSelected ? 'w-4 opacity-100' : 'w-0 opacity-0'
                )}>
                  <Check className="w-4 h-4" />
                </span>
                {getCategoryName(cat)}
              </span>
              
              {/* Glow effect on hover for unselected */}
              {!isSelected && (
                <span className="absolute inset-0 rounded-xl bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {selectedIds.length === 0 && !error && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {multiple ? 'Выберите одну или несколько категорий' : 'Выберите категорию'}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <X className="w-4 h-4 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};
