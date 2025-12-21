-- Create card_templates table
CREATE TABLE public.card_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  text_x INTEGER NOT NULL DEFAULT 50,
  text_y INTEGER NOT NULL DEFAULT 314,
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  font_size INTEGER NOT NULL DEFAULT 48,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Card templates are viewable by everyone" 
ON public.card_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage card templates" 
ON public.card_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add card_template_id to partner_applications
ALTER TABLE public.partner_applications 
ADD COLUMN card_template_id UUID REFERENCES public.card_templates(id);

-- Add card_template_id to partner_profiles
ALTER TABLE public.partner_profiles 
ADD COLUMN card_template_id UUID REFERENCES public.card_templates(id);

-- Trigger for updated_at
CREATE TRIGGER update_card_templates_updated_at
BEFORE UPDATE ON public.card_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();