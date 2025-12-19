-- Таблица для логирования ошибок уведомлений
CREATE TABLE public.notification_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  partner_profile_id UUID REFERENCES public.partner_profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('order', 'question')),
  entity_id UUID NOT NULL,
  error_message TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_notification_errors_entity ON public.notification_errors(entity_type, entity_id);
CREATE INDEX idx_notification_errors_partner ON public.notification_errors(partner_profile_id);
CREATE INDEX idx_notification_errors_resolved ON public.notification_errors(resolved);

-- RLS
ALTER TABLE public.notification_errors ENABLE ROW LEVEL SECURITY;

-- Только админы могут видеть и управлять ошибками
CREATE POLICY "Admins can manage notification errors"
ON public.notification_errors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions могут записывать ошибки (через service role)
CREATE POLICY "Service role can insert errors"
ON public.notification_errors
FOR INSERT
WITH CHECK (true);