import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, X } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-24 bg-card/50 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {t('categories')} <span className="text-destructive">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                'border',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-glow-primary'
                  : 'bg-card/50 text-foreground border-white/10 hover:border-primary/50'
              )}
            >
              <span className="flex items-center gap-1.5">
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {getCategoryName(cat)}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
};
