-- Создаём bucket для фото профилей партнёров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-photos',
  'partner-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Политика: все могут просматривать фото
CREATE POLICY "Partner photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-photos');

-- Политика: все могут загружать фото (для анкет)
CREATE POLICY "Anyone can upload partner photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'partner-photos');

-- Политика: владелец может удалять свои фото
CREATE POLICY "Users can delete own partner photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'partner-photos');

-- Добавляем колонку photo_url в partner_applications
ALTER TABLE public.partner_applications
ADD COLUMN IF NOT EXISTS photo_url text;