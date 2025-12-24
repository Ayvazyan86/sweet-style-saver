-- Create table for storing form field settings (editable labels, visibility, etc.)
CREATE TABLE public.form_field_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL, -- 'partner', 'order', 'question'
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  label_en TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(form_type, field_key)
);

-- Enable RLS
ALTER TABLE public.form_field_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for all users (needed for form rendering)
CREATE POLICY "Anyone can view form field settings"
ON public.form_field_settings
FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify form field settings"
ON public.form_field_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_form_field_settings_updated_at
BEFORE UPDATE ON public.form_field_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default field settings for Partner form (matching PartnerForm.tsx steps)
INSERT INTO public.form_field_settings (form_type, field_key, label, is_visible, is_required, sort_order) VALUES
-- Step 1: Photo
('partner', 'photo', 'Фото', true, false, 1),
('partner', 'logo', 'Логотип', true, false, 2),
-- Step 2: Personal
('partner', 'name', 'ФИО', true, true, 3),
('partner', 'birthDate', 'Дата рождения', true, true, 4),
('partner', 'profession', 'Профессия', true, true, 5),
-- Step 3: Work
('partner', 'self_description', 'О себе', true, false, 6),
('partner', 'agency_name', 'Название агентства', true, false, 7),
('partner', 'agency_description', 'Описание агентства', true, false, 8),
-- Step 4: Contacts
('partner', 'phone', 'Телефон', true, false, 9),
('partner', 'tg_channel', 'Telegram канал', true, false, 10),
('partner', 'website', 'Сайт', true, false, 11),
-- Step 5: Video platforms
('partner', 'youtube', 'YouTube', true, false, 12),
('partner', 'rutube', 'RuTube', true, false, 13),
('partner', 'dzen', 'Дзен', true, false, 14),
('partner', 'vk_video', 'VK Video', true, false, 15),
-- Step 6: Office
('partner', 'city', 'Город', true, false, 16),
('partner', 'office_address', 'Адрес офиса', true, false, 17);

-- Insert default field settings for Order form
INSERT INTO public.form_field_settings (form_type, field_key, label, is_visible, is_required, sort_order) VALUES
('order', 'categories', 'Категории', true, true, 1),
('order', 'title', 'Заголовок заказа', true, true, 2),
('order', 'text', 'Описание заказа', true, true, 3),
('order', 'city', 'Город', true, false, 4),
('order', 'budget', 'Бюджет', true, false, 5),
('order', 'contact', 'Контакт', true, false, 6);

-- Insert default field settings for Question form
INSERT INTO public.form_field_settings (form_type, field_key, label, is_visible, is_required, sort_order) VALUES
('question', 'categories', 'Категории', true, true, 1),
('question', 'text', 'Текст вопроса', true, true, 2),
('question', 'details', 'Детали', true, false, 3);