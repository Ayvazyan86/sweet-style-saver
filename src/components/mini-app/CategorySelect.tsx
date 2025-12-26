import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, X, ChevronDown, Search, 
  Camera, Video, PenTool, Scale, Megaphone, Heart, Brain, 
  Home, Wrench, Scissors, Palette, Code, Globe, Target, 
  TrendingUp, Briefcase, Building, GraduationCap, Languages,
  Dumbbell, Sparkles, Flower2, PartyPopper, Monitor, Smartphone,
  Search as SearchIcon, Zap, Car, Lightbulb, Plug, Droplet,
  Cake, Users, MessageSquare, Calculator, FileText
} from 'lucide-react';
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

// Маппинг ключевых слов к иконкам
const getCategoryIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  
  // Фото/Видео
  if (lowerName.includes('фотограф') || lowerName.includes('фото')) return Camera;
  if (lowerName.includes('видеограф') || lowerName.includes('видео') || lowerName.includes('оператор')) return Video;
  
  // Дизайн/Творчество
  if (lowerName.includes('дизайн') || lowerName.includes('графич')) return Palette;
  if (lowerName.includes('копирайт') || lowerName.includes('текст') || lowerName.includes('автор')) return PenTool;
  if (lowerName.includes('3d') || lowerName.includes('визуализ')) return Monitor;
  
  // Юридические/Финансы
  if (lowerName.includes('юрист') || lowerName.includes('адвокат') || lowerName.includes('право')) return Scale;
  if (lowerName.includes('бухгалтер') || lowerName.includes('финанс') || lowerName.includes('аудит')) return Calculator;
  
  // Маркетинг/SMM
  if (lowerName.includes('маркет') || lowerName.includes('реклам')) return Megaphone;
  if (lowerName.includes('smm') || lowerName.includes('соц')) return MessageSquare;
  if (lowerName.includes('seo') || lowerName.includes('продвиж')) return SearchIcon;
  if (lowerName.includes('таргет') || lowerName.includes('target')) return Target;
  if (lowerName.includes('аналит')) return TrendingUp;
  
  // Здоровье/Красота
  if (lowerName.includes('психолог') || lowerName.includes('терап')) return Brain;
  if (lowerName.includes('косметолог') || lowerName.includes('красот')) return Sparkles;
  if (lowerName.includes('парикмах') || lowerName.includes('стилист')) return Scissors;
  if (lowerName.includes('маникюр') || lowerName.includes('ногт')) return Sparkles;
  if (lowerName.includes('визаж') || lowerName.includes('макияж')) return Sparkles;
  if (lowerName.includes('фитнес') || lowerName.includes('тренер') || lowerName.includes('спорт')) return Dumbbell;
  if (lowerName.includes('диетолог') || lowerName.includes('питан')) return Heart;
  if (lowerName.includes('логопед')) return Languages;
  
  // Недвижимость/Строительство
  if (lowerName.includes('риэлтор') || lowerName.includes('недвиж')) return Home;
  if (lowerName.includes('строит') || lowerName.includes('ремонт')) return Building;
  if (lowerName.includes('электрик')) return Plug;
  if (lowerName.includes('сантехник')) return Droplet;
  
  // IT/Технологии
  if (lowerName.includes('it') || lowerName.includes('программ') || lowerName.includes('разработ')) return Code;
  if (lowerName.includes('мобил') || lowerName.includes('приложен')) return Smartphone;
  if (lowerName.includes('web') || lowerName.includes('сайт')) return Globe;
  
  // Авто
  if (lowerName.includes('авто') || lowerName.includes('механик')) return Car;
  
  // Образование
  if (lowerName.includes('репетит') || lowerName.includes('обучен') || lowerName.includes('учител')) return GraduationCap;
  if (lowerName.includes('перевод')) return Languages;
  
  // Мероприятия
  if (lowerName.includes('организатор') || lowerName.includes('мероприят') || lowerName.includes('event')) return PartyPopper;
  if (lowerName.includes('флорист') || lowerName.includes('цвет')) return Flower2;
  if (lowerName.includes('кондитер') || lowerName.includes('торт')) return Cake;
  
  // Консультации
  if (lowerName.includes('консульт') || lowerName.includes('бизнес')) return Briefcase;
  if (lowerName.includes('avito') || lowerName.includes('авито')) return Zap;
  
  // HR/Персонал
  if (lowerName.includes('hr') || lowerName.includes('кадр') || lowerName.includes('рекрут')) return Users;
  
  // По умолчанию
  return Briefcase;
};

export const CategorySelect = ({ selectedIds, onChange, multiple = true, error }: CategorySelectProps) => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Update position on scroll/resize when open
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

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await api.categories.list(true);

      if (error) throw new Error(error);
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
      setIsOpen(false);
    }
  };

  const getCategoryName = (cat: Category) => {
    return language === 'en' && cat.name_en ? cat.name_en : cat.name;
  };

  const clearAll = () => onChange([]);

  const filteredCategories = categories.filter(cat => 
    getCategoryName(cat).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategories = categories.filter(cat => selectedIds.includes(cat.id));

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-24 bg-card/50 rounded animate-pulse" />
        <div className="h-12 bg-card/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative space-y-3" ref={containerRef}>
      {/* Header with label */}
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        Выбрать профессию <span className="text-destructive">*</span>
        {selectedIds.length > 0 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-semibold">
            {selectedIds.length}
          </span>
        )}
      </label>

      {/* Dropdown trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          updateDropdownPosition();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl',
          'bg-card/60 backdrop-blur-sm border transition-all duration-200',
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-primary/40',
          error && 'border-destructive'
        )}
      >
        <div className="flex-1 text-left">
          {selectedIds.length === 0 ? (
            <span className="text-muted-foreground">Выберите профессию...</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedCategories.slice(0, 3).map(cat => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <span 
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-sm"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {getCategoryName(cat)}
                  </span>
                );
              })}
              {selectedCategories.length > 3 && (
                <span className="px-2 py-1 rounded-lg bg-secondary text-secondary-foreground text-sm">
                  +{selectedCategories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-muted-foreground transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown menu via portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999,
            maxHeight: '320px',
          }}
        >
          {/* Search */}
          <div className="p-3 border-b border-border bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск профессии..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Quick actions */}
          {multiple && selectedIds.length > 0 && (
            <div className="px-3 py-2 border-b border-border bg-secondary/30">
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Очистить выбор ({selectedIds.length})
              </button>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto bg-card">
            {filteredCategories.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                Профессии не найдены
              </div>
            ) : (
              filteredCategories.map(cat => {
                const isSelected = selectedIds.includes(cat.id);
                const Icon = getCategoryIcon(cat.name);
                
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors bg-card',
                      isSelected 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-secondary/50 text-foreground'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-primary/20' : 'bg-secondary'
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-sm font-medium">{getCategoryName(cat)}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Selected categories chips (when closed) */}
      {!isOpen && selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(cat => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Icon className="w-4 h-4" />
                {getCategoryName(cat)}
                <X className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
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