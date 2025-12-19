-- Create junction table for order categories
CREATE TABLE public.order_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(order_id, category_id)
);

-- Enable RLS
ALTER TABLE public.order_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Order categories can be created"
ON public.order_categories
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Order categories viewable by everyone"
ON public.order_categories
FOR SELECT
USING (true);

CREATE POLICY "Moderators can manage order categories"
ON public.order_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));