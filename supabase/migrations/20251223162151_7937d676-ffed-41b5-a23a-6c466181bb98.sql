-- Create professions table
CREATE TABLE public.professions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Professions are viewable by everyone"
  ON public.professions
  FOR SELECT
  USING (true);

-- Admin management
CREATE POLICY "Admins can manage professions"
  ON public.professions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_professions_updated_at
  BEFORE UPDATE ON public.professions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial professions
INSERT INTO public.professions (name, name_en, slug, sort_order) VALUES
  ('Риелтор', 'Realtor', 'realtor', 1),
  ('Ипотечный брокер', 'Mortgage Broker', 'mortgage-broker', 2),
  ('Застройщик', 'Developer', 'developer', 3),
  ('Оценщик недвижимости', 'Property Appraiser', 'property-appraiser', 4),
  ('Юрист по недвижимости', 'Real Estate Lawyer', 'real-estate-lawyer', 5),
  ('Агент по аренде', 'Rental Agent', 'rental-agent', 6),
  ('Управляющий недвижимостью', 'Property Manager', 'property-manager', 7),
  ('Инвестор', 'Investor', 'investor', 8),
  ('Архитектор', 'Architect', 'architect', 9),
  ('Дизайнер интерьеров', 'Interior Designer', 'interior-designer', 10),
  ('Строитель', 'Builder', 'builder', 11),
  ('Нотариус', 'Notary', 'notary', 12);