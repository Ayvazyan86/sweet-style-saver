-- Create profession_categories table
CREATE TABLE public.profession_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profession_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profession categories viewable by everyone" 
ON public.profession_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage profession categories" 
ON public.profession_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id to professions table
ALTER TABLE public.professions 
ADD COLUMN category_id uuid REFERENCES public.profession_categories(id);

-- Insert 7 categories
INSERT INTO public.profession_categories (name, name_en, slug, sort_order) VALUES
('Недвижимость', 'Real Estate', 'real-estate', 1),
('Маркетинг', 'Marketing', 'marketing', 2),
('IT и разработка', 'IT & Development', 'it-development', 3),
('Консалтинг', 'Consulting', 'consulting', 4),
('Креатив', 'Creative', 'creative', 5),
('Продажи', 'Sales', 'sales', 6),
('HR и рекрутинг', 'HR & Recruiting', 'hr-recruiting', 7);

-- Assign existing professions to categories
-- Real Estate
UPDATE public.professions SET category_id = (SELECT id FROM profession_categories WHERE slug = 'real-estate')
WHERE slug IN ('realtor', 'mortgage-broker', 'developer', 'property-appraiser', 'real-estate-lawyer', 'rental-agent', 'property-manager', 'investor', 'architect', 'interior-designer', 'builder', 'notary');

-- Marketing
UPDATE public.professions SET category_id = (SELECT id FROM profession_categories WHERE slug = 'marketing')
WHERE slug IN ('smm-manager', 'targetolog', 'content-manager', 'copywriter', 'seo-specialist', 'marketolog', 'brand-manager', 'pr-specialist', 'email-marketolog', 'ppc-specialist');

-- IT & Development
UPDATE public.professions SET category_id = (SELECT id FROM profession_categories WHERE slug = 'it-development')
WHERE slug IN ('web-designer', 'ux-ui-designer', 'web-developer', 'data-analyst');

-- Creative
UPDATE public.professions SET category_id = (SELECT id FROM profession_categories WHERE slug = 'creative')
WHERE slug IN ('graphic-designer', 'videographer', 'photographer', 'blogger', 'influencer', 'content-producer');

-- Sales
UPDATE public.professions SET category_id = (SELECT id FROM profession_categories WHERE slug = 'sales')
WHERE slug IN ('sales-manager');

-- Consulting
UPDATE public.professions SET category_id = (SELECT id FROM profession_categories WHERE slug = 'consulting')
WHERE slug IN ('business-consultant', 'financial-consultant', 'coach', 'business-trainer');

-- HR & Recruiting
UPDATE public.professions SET category_id = (SELECT id FROM profession_categories WHERE slug = 'hr-recruiting')
WHERE slug IN ('hr-specialist', 'recruiter', 'virtual-assistant', 'project-manager', 'product-manager', 'translator');

-- Add updated_at trigger
CREATE TRIGGER update_profession_categories_updated_at
BEFORE UPDATE ON public.profession_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add card_display_fields to partner_applications table to store selected fields for card
ALTER TABLE public.partner_applications
ADD COLUMN card_display_fields text[] DEFAULT ARRAY['name', 'profession', 'city', 'phone'];