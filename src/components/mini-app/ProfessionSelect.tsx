import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Check, ChevronDown, Loader2 } from 'lucide-react';
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
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const ProfessionSelect = ({ 
  value, 
  onChange, 
  error,
  required 
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

  const selectedProfession = useMemo(() => {
    return professions?.find(p => p.name === value || p.id === value);
  }, [professions, value]);

  const displayValue = selectedProfession 
    ? (language === 'en' && selectedProfession.name_en ? selectedProfession.name_en : selectedProfession.name)
    : '';

  const handleSelect = (profession: Profession) => {
    onChange(profession.name);
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              value={open ? search : displayValue}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Начните вводить профессию..."
              className={cn(
                "pl-9 pr-10 py-3 rounded-xl bg-input/50 border border-border/50",
                "hover:border-primary/50 hover:bg-input/70",
                "focus:ring-2 focus:ring-primary/30 focus:border-primary",
                error && "border-destructive focus:ring-destructive/30 focus:border-destructive"
              )}
            />
            <ChevronDown className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )} />
            {required && (
              <span className="absolute -top-2 right-0 text-primary text-xs">*</span>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border/50"
          align="start"
        >
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск профессии..."
                className="pl-9 bg-input/50 border-border/50"
                autoFocus
              />
            </div>
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
                  const isSelected = selectedProfession?.id === profession.id;
                  const label = language === 'en' && profession.name_en 
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
                      <span className="text-sm">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};
