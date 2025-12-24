import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormFieldSetting {
  id: string;
  field_key: string;
  form_type: string;
  label: string;
  label_en: string | null;
  is_visible: boolean;
  is_required: boolean;
  sort_order: number;
}

export function useFormFieldSettings(formType: 'partner' | 'order' | 'question') {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['form-field-settings', formType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_field_settings')
        .select('*')
        .eq('form_type', formType)
        .order('sort_order');
      
      if (error) throw error;
      return data as FormFieldSetting[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getFieldSetting = (fieldKey: string): FormFieldSetting | undefined => {
    return settings?.find(s => s.field_key === fieldKey);
  };

  const getLabel = (fieldKey: string, defaultLabel: string): string => {
    const setting = getFieldSetting(fieldKey);
    return setting?.label || defaultLabel;
  };

  const isRequired = (fieldKey: string, defaultRequired: boolean = false): boolean => {
    const setting = getFieldSetting(fieldKey);
    return setting?.is_required ?? defaultRequired;
  };

  const isVisible = (fieldKey: string, defaultVisible: boolean = true): boolean => {
    const setting = getFieldSetting(fieldKey);
    return setting?.is_visible ?? defaultVisible;
  };

  return {
    settings,
    isLoading,
    error,
    getFieldSetting,
    getLabel,
    isRequired,
    isVisible,
  };
}
