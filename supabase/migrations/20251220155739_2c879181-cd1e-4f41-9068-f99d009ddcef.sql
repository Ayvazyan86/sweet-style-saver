-- Добавляем поля для видеоплатформ в partner_applications
ALTER TABLE public.partner_applications 
ADD COLUMN IF NOT EXISTS rutube text,
ADD COLUMN IF NOT EXISTS dzen text,
ADD COLUMN IF NOT EXISTS vk_video text,
ADD COLUMN IF NOT EXISTS tg_video text;

-- Добавляем поля для видеоплатформ в partner_profiles  
ALTER TABLE public.partner_profiles
ADD COLUMN IF NOT EXISTS rutube text,
ADD COLUMN IF NOT EXISTS dzen text,
ADD COLUMN IF NOT EXISTS vk_video text,
ADD COLUMN IF NOT EXISTS tg_video text;

-- Переименовываем youtube для ясности (оставляем как есть, так как уже используется)