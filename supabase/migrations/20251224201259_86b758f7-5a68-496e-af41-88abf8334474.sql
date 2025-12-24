-- Add column for profession-specific descriptions in partner_applications
ALTER TABLE public.partner_applications
ADD COLUMN IF NOT EXISTS profession_descriptions jsonb DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.partner_applications.profession_descriptions IS 'JSON object mapping profession names to their descriptions, e.g. {"Риелтор": "работаю с 2010 года..."}';

-- Add column for profession-specific descriptions in partner_profiles
ALTER TABLE public.partner_profiles
ADD COLUMN IF NOT EXISTS profession_descriptions jsonb DEFAULT '{}';