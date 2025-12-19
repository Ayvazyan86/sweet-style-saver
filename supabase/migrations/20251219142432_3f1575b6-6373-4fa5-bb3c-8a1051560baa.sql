-- Create junction table for question categories
CREATE TABLE public.question_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(question_id, category_id)
);

-- Enable RLS
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Question categories can be created"
ON public.question_categories
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Question categories viewable by everyone"
ON public.question_categories
FOR SELECT
USING (true);

CREATE POLICY "Moderators can manage question categories"
ON public.question_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));