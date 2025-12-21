import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardTemplate {
  id: string;
  name: string;
  image_url: string;
  is_default: boolean;
}

interface TemplateSelectProps {
  value?: string;
  onChange: (templateId: string) => void;
  error?: string;
}

export function TemplateSelect({ value, onChange, error }: TemplateSelectProps) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['active-card-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_templates')
        .select('id, name, image_url, is_default')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as CardTemplate[];
    },
  });

  // Auto-select default template if no value
  useState(() => {
    if (!value && templates?.length) {
      const defaultTemplate = templates.find(t => t.is_default) || templates[0];
      if (defaultTemplate) {
        onChange(defaultTemplate.id);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!templates?.length) {
    return null; // No templates available, skip this step
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Выберите шаблон карточки
        </label>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => {
          const isSelected = value === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              className={cn(
                'relative aspect-video rounded-lg overflow-hidden border-2 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-white/10 hover:border-white/30'
              )}
            >
              <img
                src={template.image_url}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <span className="text-xs font-medium text-white">{template.name}</span>
                {template.is_default && (
                  <span className="ml-1 text-xs text-primary-foreground bg-primary/80 px-1 rounded">
                    ★
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
