import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X, Check, ChevronDown, Loader2, CheckCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Profession {
  id: string;
  name: string;
  name_en: string | null;
}

interface ProfessionSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  required?: boolean;
  label?: string;
}

export const ProfessionSelect = ({ 
  value = [], 
  onChange, 
  error,
  required,
  label = 'Профессия'
}: ProfessionSelectProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: professions, isLoading } = useQuery({
    queryKey: ['professions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professions')
        .select('id, name, name_en')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Profession[];
    },
  });

  const filteredProfessions = useMemo(() => {
    if (!professions) return [];
    if (!search.trim()) return professions;
    
    const searchLower = search.toLowerCase();
    return professions.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.name_en && p.name_en.toLowerCase().includes(searchLower))
    );
  }, [professions, search]);

  const selectedProfessions = useMemo(() => {
    if (!professions) return [];
    return professions.filter(p => value.includes(p.name) || value.includes(p.id));
  }, [professions, value]);

  const displayValue = selectedProfessions
    .map(p => language === 'en' && p.name_en ? p.name_en : p.name)
    .join(', ');

  const handleSelect = (profession: Profession) => {
    const isSelected = value.includes(profession.name) || value.includes(profession.id);
    if (isSelected) {
      onChange(value.filter(v => v !== profession.name && v !== profession.id));
    } else {
      onChange([...value, profession.name]);
    }
  };

  const handleRemove = (professionName: string) => {
    onChange(value.filter(v => v !== professionName));
  };

  const success = value.length > 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full px-4 py-3 rounded-xl text-left',
              'bg-card/50 backdrop-blur-sm',
              'border border-white/10',
              'text-foreground',
              'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200 flex items-center gap-2',
              error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
              success && 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20',
              !displayValue && 'text-muted-foreground'
            )}
          >
            <span className="truncate flex-1">
              {displayValue || 'Выберите профессию...'}
            </span>
            {success && (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            )}
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
              open && "rotate-180"
            )} />
          </button>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border/50"
          align="start"
        >
          <div className="p-2 border-b border-border/50">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск профессии..."
              className="bg-input/50 border-border/50"
              autoFocus
            />
          </div>

          <ScrollArea className="max-h-[250px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProfessions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Профессии не найдены
              </div>
            ) : (
              <div className="p-1">
                {filteredProfessions.map((profession) => {
                  const isSelected = value.includes(profession.name) || value.includes(profession.id);
                  const labelText = language === 'en' && profession.name_en 
                    ? profession.name_en 
                    : profession.name;

                  return (
                    <button
                      key={profession.id}
                      type="button"
                      onClick={() => handleSelect(profession)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors",
                        "hover:bg-primary/10",
                        isSelected && "bg-primary/20 text-primary"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0",
                        isSelected 
                          ? "bg-primary border-primary" 
                          : "border-border/50"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className="text-sm">{labelText}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Selected professions as tags */}
      {selectedProfessions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedProfessions.map((profession) => {
            const labelText = language === 'en' && profession.name_en 
              ? profession.name_en 
              : profession.name;
            return (
              <span 
                key={profession.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs"
              >
                {labelText}
                <button
                  type="button"
                  onClick={() => handleRemove(profession.name)}
                  className="hover:bg-primary/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <X className="w-4 h-4 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};