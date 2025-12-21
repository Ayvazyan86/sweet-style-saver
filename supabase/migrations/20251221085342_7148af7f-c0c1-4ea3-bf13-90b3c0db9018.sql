-- Create notification templates table
CREATE TABLE public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  template text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Only admins can manage notification templates"
ON public.notification_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Only admins can view templates
CREATE POLICY "Only admins can view notification templates"
ON public.notification_templates
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.notification_templates (key, name, template, description) VALUES
('new_application', 'Новая заявка партнёра', '🆕 <b>Новая заявка партнёра!</b>

👤 <b>Имя:</b> {name}
{profession_line}
{city_line}
{phone_line}', 'Уведомление администратору о новой заявке'),

('application_approved', 'Заявка одобрена', '🎉 <b>Поздравляем, {name}!</b>

Ваша заявка на вступление в партнёрскую программу одобрена!

Теперь вы являетесь официальным партнёром. Ваша карточка опубликована в канале.

Желаем успехов! 🚀', 'Уведомление партнёру об одобрении заявки'),

('application_rejected', 'Заявка отклонена', '😔 К сожалению, ваша заявка на вступление в партнёрскую программу была отклонена.

{rejection_reason_line}

Вы можете подать заявку повторно, исправив указанные замечания.', 'Уведомление партнёру об отклонении заявки'),

('new_order', 'Новый заказ', '📦 <b>Новый заказ!</b>

📝 <b>Описание:</b> {text}
{city_line}
{budget_line}

Свяжитесь с клиентом для уточнения деталей.', 'Уведомление партнёру о новом заказе'),

('new_question', 'Новый вопрос', '❓ <b>Новый вопрос!</b>

📝 <b>Вопрос:</b> {text}
{details_line}

Ответьте на вопрос, чтобы помочь клиенту.', 'Уведомление партнёру о новом вопросе');